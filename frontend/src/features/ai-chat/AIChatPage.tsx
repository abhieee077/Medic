import {
  ChevronRight,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Conversation = {
  id: string;
  title: string;
  patient: string;
  patientId: string;
  study: string;
  studyId: string;
  updated: string;
  preview: string;
};

const initialConversations: Conversation[] = [
  {
    id: "CHAT-001",
    title: "Brain MRI review",
    patient: "John Doe",
    patientId: "PT-00124",
    study: "MRI Brain w/ Contrast",
    studyId: "ST-00192",
    updated: "2 min ago",
    preview:
      "Summarize the key findings from this brain MRI.",
  },
  {
    id: "CHAT-002",
    title: "Chest CT discussion",
    patient: "Emily Carter",
    patientId: "PT-00125",
    study: "CT Chest",
    studyId: "ST-00191",
    updated: "Yesterday",
    preview: "What are the major findings?",
  },
  {
    id: "CHAT-003",
    title: "Knee MRI review",
    patient: "Michael Wilson",
    patientId: "PT-00126",
    study: "MRI Knee",
    studyId: "ST-00190",
    updated: "Apr 15",
    preview: "What should I focus on in this study?",
  },
];

function AIChatPage() {
  const navigate = useNavigate();

  const [conversations, setConversations] =
    useState(initialConversations);

  const [search, setSearch] = useState("");

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(query) ||
        conversation.patient.toLowerCase().includes(query) ||
        conversation.study.toLowerCase().includes(query) ||
        conversation.id.toLowerCase().includes(query),
    );
  }, [conversations, search]);

  const createConversation = () => {
    const nextNumber = conversations.length + 1;

    const newConversation: Conversation = {
      id: `CHAT-${String(nextNumber).padStart(3, "0")}`,
      title: "New conversation",
      patient: "John Doe",
      patientId: "PT-00124",
      study: "MRI Brain w/ Contrast",
      studyId: "ST-00192",
      updated: "Just now",
      preview: "New conversation started.",
    };

    setConversations((current) => [
      newConversation,
      ...current,
    ]);

    navigate(`/ai-chat/${newConversation.id}`);
  };

  const deleteConversation = (
    event: React.MouseEvent,
    conversationId: string,
  ) => {
    event.stopPropagation();

    setConversations((current) =>
      current.filter(
        (conversation) => conversation.id !== conversationId,
      ),
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles
                size={17}
                className="text-[#a990ff]"
              />

              <h1 className="text-lg font-semibold text-white">
                AI Assistant
              </h1>
            </div>

            <p className="mt-1 text-sm text-white/35">
              Review imaging studies with contextual AI assistance.
            </p>
          </div>

          <button
            onClick={createConversation}
            className="flex h-9 items-center gap-2 rounded-xl bg-[#7047ff] px-3 text-xs font-medium text-white transition hover:bg-[#805cff]"
          >
            <Plus size={14} />
            New Conversation
          </button>
        </div>

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
            <button
              onClick={() => setSearch("")}
              className="text-xs text-white/25 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl">
          {filteredConversations.length === 0 ? (
            <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white/25">
                <MessageSquare size={20} />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-white">
                No conversations found
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Try a different search or start a new conversation.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() =>
                    navigate(`/ai-chat/${conversation.id}`)
                  }
                  className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-[#0d1018] p-4 transition hover:border-white/15 hover:bg-white/[0.025]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7047ff]/10 text-[#a990ff]">
                    <MessageSquare size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-medium text-white/80">
                        {conversation.title}
                      </h2>

                      <span className="shrink-0 text-[10px] text-white/20">
                        {conversation.id}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-white/35">
                      {conversation.preview}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-[11px] text-white/25">
                      <span>{conversation.patient}</span>
                      <span>·</span>
                      <span>{conversation.study}</span>
                      <span>·</span>
                      <span>{conversation.updated}</span>
                    </div>
                  </div>

                  <button
                    onClick={(event) =>
                      deleteConversation(event, conversation.id)
                    }
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
    </div>
  );
}

export default AIChatPage;