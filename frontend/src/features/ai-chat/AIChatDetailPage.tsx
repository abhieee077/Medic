import {
  ArrowLeft,
  Bot,
  ChevronRight,
  ExternalLink,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteConversation,
  formatAiTime,
  getAiStatus,
  getConversation,
  sendAiMessage,
  type AiConversation,
  type AiMessage,
} from "../ai/aiApi";

const suggestions = [
  "Summarize the key findings",
  "What should I review carefully?",
  "Draft a concise impression",
  "Compare findings with the report",
];

function AIChatDetailPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [conversation, setConversation] = useState<AiConversation | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sendError, setSendError] = useState("");
  const [aiConfigured, setAiConfigured] = useState(true);

  const [message, setMessage] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    getConversation(conversationId)
      .then((data) => {
        if (cancelled) return;
        setConversation(data);
        setMessages(data.messages ?? []);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Could not load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getAiStatus()
      .then((status) => {
        if (!cancelled) setAiConfigured(status.configured);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, thinking]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#090b12] text-sm text-white/40">
        Loading conversation...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#090b12] px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white/25">
          <Bot size={21} />
        </div>

        <h1 className="mt-4 text-base font-semibold text-white">Conversation not found</h1>

        <p className="mt-1 max-w-sm text-sm text-white/30">
          {loadError || "The requested AI conversation does not exist."}
        </p>

        <button
          onClick={() => navigate("/ai-chat")}
          className="mt-5 flex h-9 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to AI Assistant
        </button>
      </div>
    );
  }

  const sendMessage = async (content = message) => {
    const trimmed = content.trim();
    if (!trimmed || thinking) return;

    setSendError("");
    setMessage("");
    setThinking(true);
    setMessages((current) => [
      ...current,
      { id: `pending-${Date.now()}`, role: "user", content: trimmed, created_at: new Date().toISOString() },
    ]);

    try {
      const updated = await sendAiMessage(conversation.id, trimmed);
      setConversation(updated);
      setMessages(updated.messages ?? []);
    } catch (error) {
      // Nothing was saved; put the question back so it can be resent.
      setMessages((current) => current.slice(0, -1));
      setMessage(trimmed);
      setSendError(error instanceof Error ? error.message : "The AI could not answer. Try again.");
    } finally {
      setThinking(false);
    }
  };

  const removeConversation = async () => {
    if (!window.confirm("Delete this conversation and its messages?")) return;
    try {
      await deleteConversation(conversation.id);
      navigate("/ai-chat");
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Could not delete the conversation.");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate("/ai-chat")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/5 hover:text-white"
            title="Back to conversations"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7047ff]/10 text-[#a990ff]">
            <Sparkles size={17} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-white">{conversation.title}</h1>
            <p className="mt-0.5 truncate text-xs text-white/30">
              {conversation.patient_name
                ? `${conversation.patient_name} · ${conversation.study_description ?? conversation.study_id}`
                : "No study linked"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation.study_id && (
            <>
              <button
                onClick={() => navigate(`/studies/${conversation.study_id}`)}
                className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/45 transition hover:bg-white/5 hover:text-white"
              >
                <ExternalLink size={14} />
                Study
              </button>

              <button
                onClick={() => navigate(`/workspace/${conversation.study_id}`)}
                className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/45 transition hover:bg-white/5 hover:text-white"
              >
                Workspace
                <ChevronRight size={13} />
              </button>
            </>
          )}

          <button
            onClick={() => void removeConversation()}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/30 transition hover:bg-white/5 hover:text-red-300"
            title="Delete conversation"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* Study context */}
      {conversation.study_id && (
        <div className="border-b border-white/10 bg-[#0b0e16] px-6 py-3">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
              Study Context
            </div>

            <div className="h-3 w-px bg-white/10" />

            <button
              onClick={() => navigate(`/studies/${conversation.study_id}`)}
              className="text-xs text-[#a990ff] transition hover:text-[#c0b2ff]"
            >
              {conversation.study_description ?? conversation.study_id}
            </button>

            <span className="text-xs text-white/20">{conversation.study_id}</span>
            <span className="text-xs text-white/20">·</span>

            {conversation.patient_id ? (
              <button
                onClick={() => navigate(`/patients/${conversation.patient_id}`)}
                className="text-xs text-white/35 transition hover:text-white/60"
              >
                {conversation.patient_name}
              </button>
            ) : (
              <span className="text-xs text-white/35">{conversation.patient_name}</span>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-4xl">
          {!aiConfigured && (
            <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-200/80">
              AI is not configured. Start the backend with an Anthropic API key
              (scripts\start-medic.ps1) to get answers.
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7047ff]/10 text-[#a990ff]">
                <Bot size={24} />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-white">
                {conversation.study_id ? "How can I help with this study?" : "How can I help?"}
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-white/35">
                Ask about findings, summarize observations, or organize information for your
                clinical review.
              </p>

              <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => void sendMessage(suggestion)}
                    disabled={thinking}
                    className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-xs text-white/50 transition hover:border-[#7047ff]/30 hover:bg-[#7047ff]/5 hover:text-white disabled:opacity-40"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 ${item.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {item.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7047ff]/10 text-[#a990ff]">
                      <Bot size={15} />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl px-4 py-3 ${
                      item.role === "user"
                        ? "bg-[#7047ff] text-white"
                        : "border border-white/10 bg-[#0d1018] text-white/70"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>

                    <div
                      className={`mt-2 text-[10px] ${
                        item.role === "user" ? "text-white/50" : "text-white/20"
                      }`}
                    >
                      {formatAiTime(item.created_at)}
                    </div>
                  </div>

                  {item.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-white/35">
                      <User size={15} />
                    </div>
                  )}
                </div>
              ))}

              {thinking && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7047ff]/10 text-[#a990ff]">
                    <Bot size={15} />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0d1018] px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Composer */}
      <footer className="border-t border-white/10 bg-[#0b0e16] px-6 py-4">
        <div className="mx-auto max-w-4xl">
          {sendError && (
            <div className="mb-2 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">
              {sendError}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#0d1018] p-2 focus-within:border-[#7047ff]/40">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder={conversation.study_id ? "Ask about this study..." : "Ask a question..."}
              rows={2}
              className="min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
            />

            <button
              onClick={() => void sendMessage()}
              disabled={!message.trim() || thinking}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7047ff] text-white transition hover:bg-[#805cff] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Send size={16} />
            </button>
          </div>

          <p className="mt-2 text-center text-[10px] text-white/20">
            AI assistance is a review aid. Clinical decisions remain physician controlled.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AIChatDetailPage;
