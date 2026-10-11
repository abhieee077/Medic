import {
  ChevronRight,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createConversation,
  deleteConversation,
  formatAiTime,
  getAiStatus,
  listConversations,
  type AiConversation,
} from "../ai/aiApi";

type StudyOption = { studyId: string; label: string };

function AIChatPage() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studyOptions, setStudyOptions] = useState<StudyOption[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listConversations()
      .then((items) => {
        if (!cancelled) setConversations(items);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load conversations. Check that the backend is running.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getAiStatus()
      .then((status) => {
        if (!cancelled) setAiConfigured(status.configured);
      })
      .catch(() => {
        if (!cancelled) setAiConfigured(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) =>
      [conversation.title, conversation.patient_name, conversation.study_description, conversation.study_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [conversations, search]);

  const openModal = async () => {
    setIsModalOpen(true);
    if (studyOptions.length > 0) return;

    try {
      const response = await fetch("/api/v1/studies/");
      const data = await response.json();
      setStudyOptions(
        (data.items ?? []).map(
          (study: { study_id: string; study_description: string | null; patient: { full_name: string } }) => ({
            studyId: study.study_id,
            label: `${study.patient.full_name} · ${study.study_description ?? study.study_id}`,
          }),
        ),
      );
    } catch {
      // A conversation without a study still works.
    }
  };

  const startConversation = async () => {
    setCreating(true);
    try {
      const conversation = await createConversation({ study_id: selectedStudyId || null });
      navigate(`/ai-chat/${conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the conversation.");
      setIsModalOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const removeConversation = async (event: React.MouseEvent, conversationId: string) => {
    event.stopPropagation();
    if (!window.confirm("Delete this conversation and its messages?")) return;

    try {
      await deleteConversation(conversationId);
      setConversations((current) => current.filter((item) => item.id !== conversationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the conversation.");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-[#a990ff]" />
              <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
            </div>

            <p className="mt-1 text-sm text-white/35">
              Review imaging studies with contextual AI assistance.
            </p>
          </div>

          <button
            onClick={() => void openModal()}
            className="flex h-9 items-center gap-2 rounded-xl bg-[#7047ff] px-3 text-xs font-medium text-white transition hover:bg-[#805cff]"
          >
            <Plus size={14} />
            New Conversation
          </button>
        </div>

        {aiConfigured === false && (
          <div className="mt-4 max-w-xl rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200/80">
            AI is not configured. Start the backend with an Anthropic API key
            (scripts\start-medic.ps1) to get answers.
          </div>
        )}

        {/* Search */}
        <div className="mt-5 flex h-10 max-w-xl items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3">
          <Search size={15} className="text-white/25" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations, patients, or studies..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
          />

          {search && (
            <button onClick={() => setSearch("")} className="text-xs text-white/25 hover:text-white">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl">
          {error && (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <p className="py-12 text-center text-sm text-white/40">Loading conversations...</p>
          ) : filteredConversations.length === 0 ? (
            <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white/25">
                <MessageSquare size={20} />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-white">
                {search ? "No conversations found" : "No conversations yet"}
              </h2>

              <p className="mt-1 text-xs text-white/30">
                {search
                  ? "Try a different search."
                  : "Start a conversation, or ask the assistant from a study's Workspace."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => navigate(`/ai-chat/${conversation.id}`)}
                  className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-[#0d1018] p-4 transition hover:border-white/15 hover:bg-white/[0.025]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7047ff]/10 text-[#a990ff]">
                    <MessageSquare size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-medium text-white/80">{conversation.title}</h2>
                      <span className="shrink-0 text-[10px] text-white/20">
                        {conversation.message_count} messages
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-white/35">
                      {conversation.last_message ?? "No messages yet."}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-[11px] text-white/25">
                      <span>{conversation.patient_name ?? "No study linked"}</span>
                      {conversation.study_description && (
                        <>
                          <span>·</span>
                          <span>{conversation.study_description}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{formatAiTime(conversation.updated_at)}</span>
                    </div>
                  </div>

                  <button
                    onClick={(event) => void removeConversation(event, conversation.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/15 opacity-0 transition hover:bg-red-400/10 hover:text-red-300 group-hover:opacity-100"
                    title="Delete conversation"
                  >
                    <Trash2 size={14} />
                  </button>

                  <ChevronRight
                    size={16}
                    className="shrink-0 text-white/20 transition group-hover:text-white/45"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1018] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">New Conversation</h2>
                <p className="mt-1 text-xs text-white/35">
                  Link a study so the assistant knows its context.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="px-5 py-5">
              <label className="mb-1.5 block text-xs font-medium text-white/50">Study</label>
              <select
                value={selectedStudyId}
                onChange={(event) => setSelectedStudyId(event.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-[#11141d] px-3 text-sm text-white outline-none focus:border-[#7047ff]/60"
              >
                <option value="">No study (general question)</option>
                {studyOptions.map((option) => (
                  <option key={option.studyId} value={option.studyId}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-9 rounded-xl border border-white/10 px-4 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => void startConversation()}
                disabled={creating}
                className="h-9 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff] disabled:opacity-50"
              >
                {creating ? "Starting..." : "Start"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIChatPage;
