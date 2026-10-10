import {
  ArrowLeft,
  Brain,
  Check,
  ChevronDown,
  Maximize2,
  MoreHorizontal,
  Send,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Study = {
  id: string;
  patientId: string;
  patient: string;
  gender: string;
  mrn: string;
  description: string;
  accession: string;
  modality: string;
  series: number;
  images: number;
  date: string;
};

const ORTHANC_STUDY_ID =
  "8a8cf898-ca27c490-d0c7058c-929d0581-2bbf104d";

const STUDY_INSTANCE_UID =
  "1.3.6.1.4.1.5962.1.2.1.20040119072730.12322";

const OHIF_VIEWER_URL =
  `http://localhost:3000/viewer?StudyInstanceUIDs=${STUDY_INSTANCE_UID}`;

const studies: Study[] = [
  {
    id: ORTHANC_STUDY_ID,
    patientId: "fa558bce-587a86d3-ad0da9b3-9d043d9d-4f5c5718",
    patient: "CompressedSamples^CT1",
    gender: "Sex: Other",
    mrn: "Patient ID: 1CT1",
    description: "CT Sample Study (e+1)",
    accession: "Not provided",
    modality: "CT",
    series: 1,
    images: 1,
    date: "Jan 19, 2004",
  },
];



function Workspace() {
  const navigate = useNavigate();
  const { studyId } = useParams();

  const study = useMemo(
    () => studies.find((item) => item.id === studyId) ?? studies[0],
    [studyId],
  );

  const [saved, setSaved] = useState(false);
  const [showSeries, setShowSeries] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const [findings, setFindings] = useState(
    "No physician-entered findings yet.",
  );

  const [impression, setImpression] = useState(
    "No impression entered yet.",
  );

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);

  const analyzeStudy = () => {
    setChatMessages((current) => [
      ...current,
      {
        role: "assistant",
        text:
          "AI analysis is not connected yet. Review the images in the DICOM viewer and enter verified findings below. No automated diagnostic analysis has been performed.",
      },
    ]);
  };

  const generateReport = () => {
    setChatMessages((current) => [
      ...current,
      {
        role: "assistant",
        text:
          "Report generation is not connected to an AI service yet. Please review the scan and enter the findings and impression based on your own interpretation.",
      },
    ]);
  };

  const compareStudy = () => {
    setChatMessages((current) => [
      ...current,
      {
        role: "assistant",
        text:
          "Previous-study comparison will be available once historical studies are connected through the backend. No prior study is currently available in this workspace.",
      },
    ]);
  };

  const sendMessage = (text = chatInput) => {
    const trimmed = text.trim();

    if (!trimmed) return;

    setChatMessages((current) => [
      ...current,
      {
        role: "user",
        text: trimmed,
      },
      {
        role: "assistant",
        text:
          "The AI service is not connected yet. I can provide a response here once the backend AI integration is implemented.",
      },
    ]);

    setChatInput("");
  };

  const useTemplate = () => {
    setFindings("");
    setImpression("");
    setSaved(false);
  };

  const saveDraft = () => {
    // This is a UI-only draft status until report persistence is connected.
    setSaved(true);
  };

  const toggleFullscreen = () => {
    setFullscreen((current) => !current);
  };

  return (
    <div
  className={`flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-[#090b12] ${
    fullscreen ? "fixed inset-0 z-50" : ""
  }`}
>
      {/* PATIENT / STUDY HEADER */}

      <header className="flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0d1018] px-5">
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={() => navigate("/studies")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
            title="Back to studies"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">
              {study.patient}
            </div>

            <div className="mt-1 truncate text-[11px] text-white/40">
              {study.mrn} · {study.gender}
            </div>
          </div>

          <div className="hidden h-8 w-px bg-white/10 sm:block" />

          <div className="hidden min-w-0 sm:block">
            <div className="text-[10px] uppercase tracking-wider text-white/30">
              Study
            </div>

            <div className="mt-1 truncate text-sm font-medium text-white">
              {study.description}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="text-[10px] uppercase tracking-wider text-white/30">
              Study date
            </div>

            <div className="mt-1 text-xs text-white/70">
              {study.date}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="text-[10px] uppercase tracking-wider text-white/30">
              Modality
            </div>

            <div className="mt-1 text-xs font-medium text-white">
              {study.modality}
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowSeries((current) => !current)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.06] hover:text-white"
          >
            View Study
            <ChevronDown
              size={14}
              className={`transition ${
                showSeries ? "rotate-180" : ""
              }`}
            />
          </button>

          {showSeries && (
            <div className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-white/10 bg-[#11141c] p-2 shadow-2xl">
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-white/25">
                Available DICOM studies
              </div>

              {studies.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setShowSeries(false);
                    navigate(`/workspace/${item.id}`);
                  }}
                  className="flex w-full items-center justify-between rounded-lg bg-[#7047ff]/10 px-3 py-2 text-left transition hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs text-white/80">
                      {item.description}
                    </div>

                    <div className="mt-1 text-[10px] text-white/35">
                      {item.date} · {item.modality}
                    </div>
                  </div>

                  <span className="ml-3 text-[10px] text-white/30">
                    {item.series} series
                  </span>
                </button>
              ))}

              <div className="px-3 py-2 text-[10px] leading-4 text-white/30">
                This list currently contains the sample study configured
                for the first viewer integration. Dynamic study loading
                from Orthanc is a subsequent step.
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN WORKSPACE */}

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_235px]">
        <div className="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* LEFT: DICOM VIEWER + FINDINGS */}

          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_115px]">
            {/* REAL OHIF DICOM VIEWER */}

            <section className="relative min-h-0 overflow-hidden bg-[#05070c]">
              <iframe
                key={study.id}
                title="MEDIC DICOM Viewer"
                src={OHIF_VIEWER_URL}
                className="absolute inset-0 h-full w-full border-0"
                allow="fullscreen"
                allowFullScreen
              />

              <button
                onClick={toggleFullscreen}
                title={
                  fullscreen
                    ? "Exit workspace fullscreen"
                    : "Fullscreen workspace"
                }
                className="absolute right-4 top-4 z-20 rounded-lg border border-white/10 bg-[#11141c]/90 p-2 text-white/70 shadow-lg transition hover:bg-white/10 hover:text-white"
              >
                <Maximize2 size={16} />
              </button>
            </section>

            {/* FINDINGS */}

            <section className="min-h-0 overflow-hidden border-t border-white/10 bg-[#0d1018]">
              <div className="flex h-full items-center justify-between gap-4 px-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      size={14}
                      className="text-[#9b7cff]"
                    />

                    <div className="text-sm font-medium text-white">
                      Findings
                    </div>
                  </div>

                  <p className="mt-1 truncate text-xs text-white/30">
                    {findings || "No findings entered yet."}
                  </p>
                </div>

                <button
                  onClick={analyzeStudy}
                  className="shrink-0 rounded-lg border border-[#7047ff]/20 bg-[#7047ff]/10 px-3 py-2 text-[10px] text-[#b9aaff] transition hover:bg-[#7047ff]/20"
                >
                  AI Assistant
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT: AI ASSISTANT */}

          <aside className="grid min-h-0 grid-rows-[62px_minmax(0,1fr)_68px] border-l border-white/10 bg-[#0d1018]">
            {/* AI HEADER */}

            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7047ff]/15">
                <Brain
                  size={16}
                  className="text-[#9b7cff]"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-white">
                  Medic AI Assistant
                </div>

                <div className="text-[10px] text-white/30">
                  AI Copilot · {study.modality} study
                </div>
              </div>

              <button
                className="ml-auto text-white/30 hover:text-white"
                title="AI options"
              >
                <MoreHorizontal size={17} />
              </button>
            </div>

            {/* AI CONTENT */}

            <div className="min-h-0 overflow-y-auto p-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Sparkles
                    size={14}
                    className="text-[#9b7cff]"
                  />
                  Hello, Doctor 👋
                </div>

                <p className="mt-2 text-xs leading-5 text-white/40">
                  You are viewing a sample DICOM study in OHIF. Review
                  the actual images before documenting clinical findings.
                  The AI service is not connected, and no diagnostic
                  analysis has been performed.
                </p>
              </div>

              {chatMessages.length > 0 && (
                <div className="mt-4 space-y-2">
                  {chatMessages.map((item, index) => (
                    <div
                      key={`${item.role}-${index}`}
                      className={`rounded-xl p-3 text-xs leading-5 ${
                        item.role === "user"
                          ? "ml-6 bg-[#7047ff]/15 text-white/75"
                          : "mr-3 border border-white/10 bg-white/[0.025] text-white/45"
                      }`}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-2">
                <button
                  onClick={analyzeStudy}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.015] px-3 py-2.5 text-left text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Analyze Study
                </button>

                <button
                  onClick={compareStudy}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.015] px-3 py-2.5 text-left text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Compare Previous Study
                </button>

                <button
                  onClick={generateReport}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.015] px-3 py-2.5 text-left text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Generate Draft Report
                </button>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="mb-3 text-[10px] uppercase tracking-wider text-white/25">
                  Suggested
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => sendMessage("Summarize study")}
                    className="rounded-lg bg-white/[0.035] px-3 py-2 text-[10px] text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Summarize study
                  </button>

                  <button
                    onClick={() => sendMessage("Explain findings")}
                    className="rounded-lg bg-white/[0.035] px-3 py-2 text-[10px] text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Explain findings
                  </button>

                  <button
                    onClick={() => sendMessage("Draft an impression")}
                    className="rounded-lg bg-white/[0.035] px-3 py-2 text-[10px] text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Draft impression
                  </button>
                </div>
              </div>
            </div>

            {/* CHAT INPUT */}

            <div className="border-t border-white/10 p-3">
              <div className="flex h-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 focus-within:border-[#7047ff]/40">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) =>
                    setChatInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask anything about this study..."
                  className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25"
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={!chatInput.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* REPORT EDITOR */}

        <section className="min-h-0 overflow-hidden border-t border-white/10 bg-[#0d1018]">
          {/* REPORT HEADER */}

          <div className="flex h-[52px] items-center justify-between border-b border-white/10 px-4">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-white">
                Report Editor
              </div>

              <span
                className={`rounded-md px-2 py-1 text-[9px] ${
                  saved
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-white/5 text-white/30"
                }`}
              >
                {saved ? "Saved locally" : "Draft"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={useTemplate}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/45 transition hover:bg-white/5 hover:text-white"
              >
                Clear Fields
              </button>

              <button
                onClick={saveDraft}
                className="flex items-center gap-2 rounded-lg bg-[#7047ff] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#805cff]"
              >
                {saved && <Check size={13} />}
                {saved ? "Saved locally" : "Save Draft"}
              </button>
            </div>
          </div>

          {/* REPORT FIELDS */}

          <div className="grid h-[calc(100%-52px)] grid-cols-2 gap-4 p-4">
            <div className="flex min-h-0 flex-col">
              <label
                htmlFor="report-findings"
                className="text-[10px] font-medium uppercase tracking-wider text-white/30"
              >
                Findings
              </label>

              <textarea
                id="report-findings"
                value={findings}
                onChange={(event) => {
                  setFindings(event.target.value);
                  setSaved(false);
                }}
                placeholder="Document verified imaging findings..."
                className="mt-2 min-h-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-white outline-none placeholder:text-white/20 transition focus:border-[#7047ff]/50"
              />
            </div>

            <div className="flex min-h-0 flex-col">
              <label
                htmlFor="report-impression"
                className="text-[10px] font-medium uppercase tracking-wider text-white/30"
              >
                Impression
              </label>

              <textarea
                id="report-impression"
                value={impression}
                onChange={(event) => {
                  setImpression(event.target.value);
                  setSaved(false);
                }}
                placeholder="Enter the reviewed impression..."
                className="mt-2 min-h-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-white outline-none placeholder:text-white/20 transition focus:border-[#7047ff]/50"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Workspace;