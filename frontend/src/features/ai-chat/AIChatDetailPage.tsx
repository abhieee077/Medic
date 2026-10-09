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
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  time: string;
};

type Conversation = {
  id: string;
  title: string;
  patient: string;
  patientId: string;
  study: string;
  studyId: string;
  messages: Message[];
};

const conversations: Conversation[] = [
  {
    id: "CHAT-001",
    title: "Brain MRI review",
    patient: "John Doe",
    patientId: "PT-00124",
    study: "MRI Brain w/ Contrast",
    studyId: "ST-00192",
    messages: [
      {
        id: 1,
        role: "user",
        content:
          "Summarize the key findings from this brain MRI.",
        time: "10:42 AM",
      },
      {
        id: 2,
        role: "assistant",
        content:
          "The study demonstrates no acute intracranial hemorrhage or mass effect. Mild scattered T2/FLAIR hyperintense foci are present within the periventricular white matter. Overall, there is no acute intracranial abnormality.",
        time: "10:42 AM",
      },
    ],
  },
  {
    id: "CHAT-002",
    title: "Chest CT discussion",
    patient: "Emily Carter",
    patientId: "PT-00125",
    study: "CT Chest",
    studyId: "ST-00191",
    messages: [
      {
        id: 1,
        role: "user",
        content: "What are the major findings?",
        time: "Yesterday",
      },
      {
        id: 2,
        role: "assistant",
        content:
          "No focal airspace consolidation, pleural effusion, or pneumothorax is described. The cardiomediastinal silhouette is within normal limits.",
        time: "Yesterday",
      },
    ],
  },
  {
    id: "CHAT-003",
    title: "Knee MRI review",
    patient: "Michael Wilson",
    patientId: "PT-00126",
    study: "MRI Knee",
    studyId: "ST-00190",
    messages: [
      {
        id: 1,
        role: "user",
        content:
          "What should I focus on in this study?",
        time: "Apr 15",
      },
      {
        id: 2,
        role: "assistant",
        content:
          "The current study notes mild joint effusion and increased signal involving the medial meniscus. Clinical correlation may be useful.",
        time: "Apr 15",
      },
    ],
  },
];

const suggestions = [
  "Summarize the key findings",
  "What should I review carefully?",
  "Draft a concise impression",
  "Compare findings with the report",
];

function AIChatDetailPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const conversation = conversations.find(
    (item) => item.id === conversationId,
  );

  const [messages, setMessages] = useState<Message[]>(
    conversation?.messages ?? [],
  );

  const [message, setMessage] = useState("");
  const [thinking, setThinking] = useState(false);

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#090b12] px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white/25">
          <Bot size={21} />
        </div>

        <h1 className="mt-4 text-base font-semibold text-white">
          Conversation not found
        </h1>

        <p className="mt-1 max-w-sm text-sm text-white/30">
          The requested AI conversation does not exist in the current
          workspace.
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

  const sendMessage = (content = message) => {
    const trimmed = content.trim();

    if (!trimmed || thinking) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmed,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setMessage("");
    setThinking(true);

    window.setTimeout(() => {
      const response: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Based on the available study context, the imaging findings should be reviewed alongside the patient's clinical history and the complete study. I can help organize observations, summarize findings, or draft a concise impression for physician review.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((current) => [
        ...current,
        response,
      ]);

      setThinking(false);
    }, 900);
  };

  const clearConversation = () => {
    setMessages([]);
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
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-white">
                {conversation.title}
              </h1>

              <span className="text-[10px] text-white/20">
                {conversation.id}
              </span>
            </div>

            <p className="mt-0.5 truncate text-xs text-white/30">
              {conversation.patient} · {conversation.study}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              navigate(`/studies/${conversation.studyId}`)
            }
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <ExternalLink size={14} />
            Study
          </button>

          <button
            onClick={() =>
              navigate(`/workspace/${conversation.studyId}`)
            }
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            Workspace
            <ChevronRight size={13} />
          </button>

          <button
            onClick={clearConversation}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/30 transition hover:bg-white/5 hover:text-red-300"
            title="Clear conversation"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* Study context */}
      <div className="border-b border-white/10 bg-[#0b0e16] px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
            Study Context
          </div>

          <div className="h-3 w-px bg-white/10" />

          <button
            onClick={() =>
              navigate(`/studies/${conversation.studyId}`)
            }
            className="text-xs text-[#a990ff] transition hover:text-[#c0b2ff]"
          >
            {conversation.study}
          </button>

          <span className="text-xs text-white/20">
            {conversation.studyId}
          </span>

          <span className="text-xs text-white/20">
            ·
          </span>

          <button
            onClick={() =>
              navigate(`/patients/${conversation.patientId}`)
            }
            className="text-xs text-white/35 transition hover:text-white/60"
          >
            {conversation.patient}
          </button>
        </div>
      </div>

      {/* Messages */}
      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-4xl">
          {messages.length === 0 ? (
            <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7047ff]/10 text-[#a990ff]">
                <Bot size={24} />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-white">
                How can I help with this study?
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-white/35">
                Ask about findings, summarize observations, or
                organize information for your clinical review.
              </p>

              <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-xs text-white/50 transition hover:border-[#7047ff]/30 hover:bg-[#7047ff]/5 hover:text-white"
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
                  className={`flex gap-3 ${
                    item.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
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
                        : "border border-white/10 bg-[#0d1018] text-white/65"
                    }`}
                  >
                    <p className="text-sm leading-6">
                      {item.content}
                    </p>

                    <div
                      className={`mt-2 text-[10px] ${
                        item.role === "user"
                          ? "text-white/50"
                          : "text-white/20"
                      }`}
                    >
                      {item.time}
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
        </div>
      </main>

      {/* Composer */}
      <footer className="border-t border-white/10 bg-[#0b0e16] px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#0d1018] p-2 focus-within:border-[#7047ff]/40">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about this study..."
              rows={2}
              className="min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
            />

            <button
              onClick={() => sendMessage()}
              disabled={!message.trim() || thinking}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7047ff] text-white transition hover:bg-[#805cff] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Send size={16} />
            </button>
          </div>

          <p className="mt-2 text-center text-[10px] text-white/20">
            AI assistance is presented as a review aid. Clinical
            decisions remain physician controlled.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AIChatDetailPage;