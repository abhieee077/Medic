import {
  ArrowLeft,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MoreHorizontal,
  RotateCcw,
  Send,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Study = {
  id: string;
  patientId: string;
  patient: string;
  age: number;
  gender: string;
  dob: string;
  mrn: string;
  description: string;
  accession: string;
  modality: string;
  series: number;
  images: number;
  date: string;
};

const studies: Study[] = [
  {
    id: "ST-00192",
    patientId: "PT-00124",
    patient: "John Doe",
    age: 45,
    gender: "Male",
    dob: "May 12, 1980",
    mrn: "MRN 987654",
    description: "MRI Brain w/ Contrast",
    accession: "MR20250420-001",
    modality: "MR",
    series: 4,
    images: 192,
    date: "Apr 20, 2025",
  },
  {
    id: "ST-00191",
    patientId: "PT-00125",
    patient: "Emily Carter",
    age: 38,
    gender: "Female",
    dob: "Aug 24, 1986",
    mrn: "MRN 987655",
    description: "CT Chest",
    accession: "CT20250418-001",
    modality: "CT",
    series: 3,
    images: 156,
    date: "Apr 18, 2025",
  },
  {
    id: "ST-00190",
    patientId: "PT-00126",
    patient: "Michael Wilson",
    age: 62,
    gender: "Male",
    dob: "Feb 03, 1963",
    mrn: "MRN 987656",
    description: "MRI Knee",
    accession: "MR20250415-001",
    modality: "MR",
    series: 5,
    images: 248,
    date: "Apr 15, 2025",
  },
  {
    id: "ST-00189",
    patientId: "PT-00127",
    patient: "Sophia Martinez",
    age: 29,
    gender: "Female",
    dob: "Nov 17, 1995",
    mrn: "MRN 987657",
    description: "CT Head",
    accession: "CT20250411-001",
    modality: "CT",
    series: 2,
    images: 84,
    date: "Apr 11, 2025",
  },
  {
    id: "ST-00188",
    patientId: "PT-00128",
    patient: "Daniel Brown",
    age: 51,
    gender: "Male",
    dob: "Jun 29, 1973",
    mrn: "MRN 987658",
    description: "X-Ray Chest",
    accession: "CR20250409-001",
    modality: "CR",
    series: 1,
    images: 2,
    date: "Apr 09, 2025",
  },
];

const seriesByStudy: Record<string, string[]> = {
  "ST-00192": [
    "Axial T1 + Contrast",
    "Axial T2 FLAIR",
    "Sagittal T1",
    "DWI",
  ],
  "ST-00191": ["Axial Chest", "Coronal", "Sagittal"],
  "ST-00190": [
    "Sagittal PD",
    "Coronal T2",
    "Axial T2",
    "Sagittal T1",
    "Localizer",
  ],
  "ST-00189": ["Axial Head", "Coronal"],
  "ST-00188": ["PA Chest"],
};

function Workspace() {
  const navigate = useNavigate();
  const { studyId } = useParams();

  const study = useMemo(
    () => studies.find((item) => item.id === studyId) ?? studies[0],
    [studyId],
  );

  const seriesList = seriesByStudy[study.id] ?? ["Default Series"];

  const [selectedSeries, setSelectedSeries] = useState(0);
  const [imageIndex, setImageIndex] = useState(1);
  const [zoom, setZoom] = useState(100);
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

  const totalImages = study.images;

  const changeImage = (direction: number) => {
    setImageIndex((current) =>
      Math.min(
        totalImages,
        Math.max(1, current + direction),
      ),
    );
  };

  const resetViewer = () => {
    setZoom(100);
    setImageIndex(1);
  };

  const analyzeStudy = () => {
    setFindings(
      "AI analysis preview: No acute abnormality is identified in the current mock study context. Mild nonspecific findings may be present. Review the complete study and clinical history before final interpretation.",
    );

    setImpression(
      "No acute abnormality identified on the current AI analysis preview.",
    );
  };

  const generateReport = () => {
    setFindings(
      "Brain MRI demonstrates no acute intracranial hemorrhage, mass effect, or focal diffusion restriction. Mild scattered T2/FLAIR hyperintense foci are noted within the periventricular white matter.",
    );

    setImpression(
      "No acute intracranial abnormality. Mild nonspecific white matter signal changes.",
    );
  };

  const compareStudy = () => {
    setChatMessages((current) => [
      ...current,
      {
        role: "assistant",
        text: "Previous-study comparison will use longitudinal imaging data once historical studies are available through the backend.",
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
        text: "Based on the current study context, I can help organize observations, summarize findings, or draft a concise impression. Actual AI responses will be provided once the backend AI service is connected.",
      },
    ]);

    setChatInput("");
  };

  const useTemplate = () => {
    setFindings(
      "Study demonstrates expected anatomical structures without an acute focal abnormality. Additional findings should be documented following physician review.",
    );

    setImpression(
      "No acute abnormality identified.",
    );

    setSaved(false);
  };

  const saveDraft = () => {
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2200);
  };

  const toggleFullscreen = () => {
    setFullscreen((current) => !current);
  };

  return (
    <div
      className={`flex h-full min-h-0 flex-col bg-[#090b12] ${
        fullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* =========================================================
          PATIENT / STUDY HEADER
      ========================================================= */}

      <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/10 bg-[#0d1018] px-5">
        <div className="flex min-w-0 items-center gap-5">
          <button
            onClick={() =>
              navigate(`/studies/${study.id}`)
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
            title="Back to study"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  navigate(`/patients/${study.patientId}`)
                }
                className="text-[15px] font-semibold text-white transition hover:text-[#b9aaff]"
              >
                {study.patient}
              </button>

              <span className="text-xs text-white/35">
                {study.mrn}
              </span>
            </div>

            <div className="mt-1 text-[11px] text-white/40">
              {study.gender} · {study.age}Y · {study.dob}
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-white/30">
              Study
            </div>

            <div className="mt-1 truncate text-sm font-medium text-white">
              {study.description}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="text-[10px] uppercase tracking-wider text-white/30">
              Accession No.
            </div>

            <div className="mt-1 font-mono text-xs text-white/70">
              {study.accession}
            </div>
          </div>

          <div>
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
            View All Studies
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
                Patient Studies
              </div>

              {studies
                .filter(
                  (item) =>
                    item.patientId === study.patientId,
                )
                .concat(
                  studies.filter(
                    (item) =>
                      item.patientId !== study.patientId,
                  ),
                )
                .slice(0, 4)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setShowSeries(false);
                      navigate(`/workspace/${item.id}`);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-white/5 ${
                      item.id === study.id
                        ? "bg-[#7047ff]/10"
                        : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs text-white/70">
                        {item.description}
                      </div>

                      <div className="mt-0.5 text-[10px] text-white/25">
                        {item.date} · {item.modality}
                      </div>
                    </div>

                    <span className="ml-3 text-[10px] text-white/20">
                      {item.id}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </header>

      {/* =========================================================
          MAIN WORKSPACE
      ========================================================= */}

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_235px]">
        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_380px]">
          {/* =====================================================
              LEFT: VIEWER + FINDINGS
          ===================================================== */}

          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_115px]">
            {/* ================= VIEWER ================= */}

            <section className="relative min-h-0 overflow-hidden bg-[#05070c]">
              {/* Viewer toolbar */}

              <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#11141c]/90 p-1.5 shadow-xl backdrop-blur">
                  <button
                    onClick={() =>
                      setZoom((current) =>
                        Math.min(200, current + 10),
                      )
                    }
                    title="Zoom in"
                    className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <ZoomIn size={16} />
                  </button>

                  <button
                    onClick={() =>
                      setZoom((current) =>
                        Math.max(50, current - 10),
                      )
                    }
                    title="Zoom out"
                    className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <ZoomOut size={16} />
                  </button>

                  <button
                    onClick={resetViewer}
                    title="Reset"
                    className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <div className="mx-1 h-5 w-px bg-white/10" />

                  <button
                    onClick={toggleFullscreen}
                    title="Fullscreen"
                    className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <Maximize2 size={16} />
                  </button>

                  <span className="px-2 text-[10px] font-mono text-white/25">
                    {zoom}%
                  </span>
                </div>

                <button
                  className="rounded-lg border border-white/10 bg-[#11141c]/90 p-2 text-white/45 transition hover:text-white"
                  title="More viewer options"
                >
                  <MoreHorizontal size={17} />
                </button>
              </div>

              {/* Series selector */}

              <div className="absolute bottom-10 left-4 z-10">
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowSeries((current) => !current)
                    }
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#11141c]/90 px-3 py-2 text-xs text-white/55 backdrop-blur transition hover:text-white"
                  >
                    <span className="max-w-40 truncate">
                      {seriesList[selectedSeries]}
                    </span>
                    <ChevronDown size={13} />
                  </button>

                  {showSeries && (
                    <div className="absolute bottom-11 left-0 z-30 w-56 rounded-xl border border-white/10 bg-[#11141c] p-2 shadow-2xl">
                      {seriesList.map((series, index) => (
                        <button
                          key={series}
                          onClick={() => {
                            setSelectedSeries(index);
                            setImageIndex(1);
                            setShowSeries(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-xs transition hover:bg-white/5 ${
                            index === selectedSeries
                              ? "bg-[#7047ff]/10 text-[#b8aaff]"
                              : "text-white/50"
                          }`}
                        >
                          {series}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mock viewer */}

              <div className="flex h-full items-center justify-center">
                <div
                  className="relative flex aspect-square w-[min(52vh,520px)] items-center justify-center overflow-hidden rounded-lg border border-white/[0.06] bg-[#090c13]"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transition: "transform 180ms ease",
                  }}
                >
                  <div className="absolute inset-[12%] rounded-full border border-white/[0.05]" />

                  <div className="absolute h-[62%] w-[62%] rounded-full border border-white/[0.07]" />

                  <div className="absolute h-[42%] w-[42%] rounded-full bg-white/[0.018] blur-sm" />

                  <Brain
                    size={100}
                    strokeWidth={0.8}
                    className="relative text-white/[0.10]"
                  />

                  <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-mono text-white/20">
                    DICOM VIEWER PREVIEW
                  </div>
                </div>
              </div>

              {/* Image controls */}

              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-white/10 bg-[#11141c]/90 px-2 py-1 backdrop-blur">
                <button
                  onClick={() => changeImage(-1)}
                  disabled={imageIndex <= 1}
                  className="rounded-md p-1 text-white/45 transition hover:bg-white/10 hover:text-white disabled:opacity-20"
                >
                  <ChevronLeft size={14} />
                </button>

                <span className="min-w-20 text-center text-[10px] font-mono text-white/35">
                  Image {imageIndex} / {totalImages}
                </span>

                <button
                  onClick={() => changeImage(1)}
                  disabled={imageIndex >= totalImages}
                  className="rounded-md p-1 text-white/45 transition hover:bg-white/10 hover:text-white disabled:opacity-20"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Viewer status */}

              <div className="absolute bottom-3 left-4 text-[10px] font-mono text-white/30">
                WW: 1200 · WL: 600
              </div>
            </section>

            {/* ================= FINDINGS ================= */}

            <section className="min-h-0 overflow-hidden border-t border-white/10 bg-[#0d1018]">
              <div className="flex h-full items-center justify-between gap-4 px-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      size={14}
                      className="text-[#9b7cff]"
                    />

                    <div className="text-sm font-medium text-white">
                      AI Findings
                    </div>
                  </div>

                  <p className="mt-1 truncate text-xs text-white/30">
                    {findings}
                  </p>
                </div>

                <button
                  onClick={analyzeStudy}
                  className="shrink-0 rounded-lg border border-[#7047ff]/20 bg-[#7047ff]/10 px-3 py-2 text-[10px] text-[#b9aaff] transition hover:bg-[#7047ff]/20"
                >
                  Analyze
                </button>
              </div>
            </section>
          </div>

          {/* =====================================================
              RIGHT: AI ASSISTANT
          ===================================================== */}

          <aside className="grid min-h-0 grid-rows-[62px_minmax(0,1fr)_68px] border-l border-white/10 bg-[#0d1018]">
            {/* AI Header */}

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
                  AI Copilot · {study.id}
                </div>
              </div>

              <button
                className="ml-auto text-white/30 hover:text-white"
                title="AI options"
              >
                <MoreHorizontal size={17} />
              </button>
            </div>

            {/* AI Content */}

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
                  I'm ready to assist with{" "}
                  {study.patient}'s {study.description}.
                  Upload and AI analysis will be connected
                  through the backend later.
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
                    onClick={() =>
                      sendMessage("Summarize study")
                    }
                    className="rounded-lg bg-white/[0.035] px-3 py-2 text-[10px] text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Summarize study
                  </button>

                  <button
                    onClick={() =>
                      sendMessage("Explain findings")
                    }
                    className="rounded-lg bg-white/[0.035] px-3 py-2 text-[10px] text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Explain findings
                  </button>

                  <button
                    onClick={() =>
                      sendMessage("Draft an impression")
                    }
                    className="rounded-lg bg-white/[0.035] px-3 py-2 text-[10px] text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Draft impression
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Input */}

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

        {/* =======================================================
            REPORT EDITOR
        ======================================================= */}

        <section className="min-h-0 overflow-hidden border-t border-white/10 bg-[#0d1018]">
          {/* Report Header */}

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
                {saved ? "Saved" : "Draft"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={useTemplate}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/45 transition hover:bg-white/5 hover:text-white"
              >
                Templates
              </button>

              <button
                onClick={saveDraft}
                className="flex items-center gap-2 rounded-lg bg-[#7047ff] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#805cff]"
              >
                {saved && <Check size={13} />}
                {saved ? "Saved" : "Save Draft"}
              </button>
            </div>
          </div>

          {/* Report fields */}

          <div className="grid h-[calc(100%-52px)] grid-cols-2 gap-4 p-4">
            {/* Findings */}

            <div className="flex min-h-0 flex-col">
              <label className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                Findings
              </label>

              <textarea
                value={findings}
                onChange={(event) => {
                  setFindings(event.target.value);
                  setSaved(false);
                }}
                placeholder="Document imaging findings..."
                className="mt-2 min-h-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-white outline-none placeholder:text-white/20 transition focus:border-[#7047ff]/50"
              />
            </div>

            {/* Impression */}

            <div className="flex min-h-0 flex-col">
              <label className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                Impression
              </label>

              <textarea
                value={impression}
                onChange={(event) => {
                  setImpression(event.target.value);
                  setSaved(false);
                }}
                placeholder="Enter impression..."
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