import {
  ArrowLeft,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  RotateCcw,
  Send,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { OHIF_URL, ohifViewerUrl } from "../features/viewer/ohif";
import { fetchReports } from "../features/reports/reportApi";
import {
  analyzeStudy,
  createConversation,
  formatAiTime,
  getAiStatus,
  getConversation,
  listAnalyses,
  listConversations,
  sendAiMessage,
  type AiAnalysis,
  type AiStatus,
} from "../features/ai/aiApi";

type StudySummary = {
  id: string;
  patientId: string;
  patient: string;
  description: string;
  modality: string;
  date: string;
  accession: string;
  studyInstanceUid: string | null;
};

type PatientDetails = {
  mrn: string;
  gender: string;
  age: number | null;
  dob: string;
};

type SeriesItem = {
  uid: string;
  name: string;
  images: number;
};

type ApiStudy = {
  study_id: string;
  study_description: string | null;
  modality: string | null;
  study_date: string | null;
  accession_number: string | null;
  study_instance_uid: string | null;
  patient: { patient_id: string; full_name: string };
};

function formatDate(date: string | null): string {
  if (!date) return "Date unavailable";

  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function toStudySummary(study: ApiStudy): StudySummary {
  return {
    id: study.study_id,
    patientId: study.patient.patient_id,
    patient: study.patient.full_name,
    description: study.study_description || "Untitled study",
    modality: study.modality || "—",
    date: formatDate(study.study_date),
    accession: study.accession_number || "—",
    studyInstanceUid: study.study_instance_uid,
  };
}

function Workspace() {
  const navigate = useNavigate();
  const { studyId } = useParams();

  const [studies, setStudies] = useState<StudySummary[]>([]);
  const [studiesLoading, setStudiesLoading] = useState(true);
  const [studiesError, setStudiesError] = useState("");
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [seriesItems, setSeriesItems] = useState<SeriesItem[]>([]);

  const study = useMemo(
    () =>
      (studyId ? studies.find((item) => item.id === studyId) : studies[0]) ?? null,
    [studies, studyId],
  );
  const currentStudyId = study?.id;
  const currentPatientId = study?.patientId;

  const seriesList = seriesItems.length > 0 ? seriesItems : null;

  // Only imported studies have a StudyInstanceUID, so only they can be viewed.
  const viewerUrl = study?.studyInstanceUid ? ohifViewerUrl(study.studyInstanceUid) : null;
  const [ohifUnreachable, setOhifUnreachable] = useState(false);

  useEffect(() => {
    if (!viewerUrl) return;
    const controller = new AbortController();

    // The relay reports whether it can reach the OHIF host. OHIF's own pages
    // can't be read cross-origin (Cross-Origin-Resource-Policy: same-origin).
    fetch(`${OHIF_URL}/__relay/health`, { cache: "no-store", signal: controller.signal })
      .then((response) => setOhifUnreachable(!response.ok))
      .catch(() => {
        if (!controller.signal.aborted) setOhifUnreachable(true);
      });

    return () => controller.abort();
  }, [viewerUrl]);

  const [selectedSeries, setSelectedSeries] = useState(0);
  const [imageIndex, setImageIndex] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSeries, setShowSeries] = useState(false);
  const [showStudies, setShowStudies] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");
  const [draftLoading, setDraftLoading] = useState(true);
  const [draftLoadError, setDraftLoadError] = useState("");

  // Handlers that finish after an await read the editor through these refs,
  // so they see what the user typed in the meantime.
  const findingsRef = useRef(findings);
  const impressionRef = useRef(impression);
  useEffect(() => {
    findingsRef.current = findings;
    impressionRef.current = impression;
  }, [findings, impression]);

  // Set when the study has no draft but already has a finalized report.
  const [finalizedReportId, setFinalizedReportId] = useState<string | null>(null);

  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);

  useEffect(() => {
    getAiStatus()
      .then(setAiStatus)
      .catch(() => setAiStatus({ configured: false, provider: null, model: null }));
  }, []);

  // Restore the latest AI draft and the study's conversation.
  useEffect(() => {
    if (!currentStudyId) return;
    let cancelled = false;

    listAnalyses(currentStudyId)
      .then((items) => {
        if (!cancelled) setAnalysis(items.find((item) => item.status === "COMPLETED") ?? null);
      })
      .catch(() => undefined);

    listConversations(currentStudyId)
      .then(async (items) => {
        if (cancelled || items.length === 0) return;
        const conversation = await getConversation(items[0].id);
        if (cancelled) return;
        setConversationId(conversation.id);
        setChatMessages(
          (conversation.messages ?? []).map((item) => ({ role: item.role, text: item.content })),
        );
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [currentStudyId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudies() {
      try {
        const response = await fetch("/api/v1/studies/", { signal: controller.signal });
        if (!response.ok) throw new Error(`Studies request failed (${response.status})`);

        const data: { items: ApiStudy[] } = await response.json();
        setStudies(data.items.map(toStudySummary));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not load studies:", error);
        setStudiesError("Could not load studies. Check that the backend is running.");
      } finally {
        if (!controller.signal.aborted) setStudiesLoading(false);
      }
    }

    void loadStudies();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!currentStudyId || !currentPatientId) return;
    const controller = new AbortController();
    const { signal } = controller;

    setPatientDetails(null);
    setSeriesItems([]);
    setSelectedSeries(0);
    setImageIndex(1);
    setAnalysis(null);
    setAiError("");
    setConversationId(null);
    setChatMessages([]);

    void fetch(`/api/v1/patients/${encodeURIComponent(currentPatientId)}`, { signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((patient) => {
        if (!patient || signal.aborted) return;
        setPatientDetails({
          mrn: patient.mrn ? `MRN ${patient.mrn}` : "MRN unavailable",
          gender: patient.gender || "Not specified",
          age: calculateAge(patient.date_of_birth),
          dob: patient.date_of_birth ? formatDate(patient.date_of_birth) : "DOB unavailable",
        });
      })
      .catch(() => undefined);

    void fetch(`/api/v1/studies/${encodeURIComponent(currentStudyId)}/series`, { signal })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data) => {
        if (signal.aborted) return;
        setSeriesItems(
          (data.items ?? []).map(
            (
              item: {
                series_instance_uid: string;
                series_description: string | null;
                number_of_instances: number | null;
              },
              index: number,
            ) => ({
              uid: item.series_instance_uid,
              name: item.series_description || `Series ${index + 1}`,
              images: item.number_of_instances ?? 0,
            }),
          ),
        );
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [currentStudyId, currentPatientId]);

  useEffect(() => {
    if (!currentStudyId) return;
    let cancelled = false;

    async function loadDraft() {
      setFindings("");
      setImpression("");
      setSaved(false);
      setFinalizedReportId(null);
      setDraftLoading(true);
      setDraftLoadError("");

      try {
        const response = await fetch(
          `/api/v1/reports/study/${encodeURIComponent(currentStudyId ?? "")}`
        );

        if (!response.ok) {
          throw new Error(`Draft loading failed (${response.status})`);
        }

        const data = await response.json();

        if (!cancelled && data.draft) {
          setFindings(data.draft.findings ?? "");
          setImpression(data.draft.impression ?? "");
          setSaved(true);
        } else if (!cancelled) {
          const finalized = (await fetchReports()).find(
            (report) => report.studyId === currentStudyId && report.status === "Finalized",
          );
          if (!cancelled && finalized) setFinalizedReportId(finalized.id);
        }
      } catch (error) {
        console.error("Could not load report draft:", error);
        // Saving now could overwrite a draft that exists but failed to load.
        if (!cancelled) setDraftLoadError("Could not load this study's draft. Reload before editing.");
      } finally {
        if (!cancelled) setDraftLoading(false);
      }
    }

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [currentStudyId]);

  const totalImages = seriesList?.[selectedSeries]?.images ?? 0;

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

  const aiReady = Boolean(aiStatus?.configured);

  // The status request may still be in flight right after the page loads.
  const ensureAiReady = async () => {
    if (aiStatus) return aiStatus.configured;
    try {
      const status = await getAiStatus();
      setAiStatus(status);
      return status.configured;
    } catch {
      return false;
    }
  };
  const AI_NOT_CONFIGURED =
    "AI is not configured. Restart the backend with an Anthropic API key (scripts\\start-medic.ps1).";

  // AI output is a draft: it is shown here and only enters the report when
  // the physician clicks Insert.
  const runAnalysis = async (): Promise<AiAnalysis | null> => {
    if (!study) return null;
    if (!(await ensureAiReady())) {
      setAiError(AI_NOT_CONFIGURED);
      return null;
    }

    setAnalyzing(true);
    setAiError("");
    try {
      const result = await analyzeStudy(study.id);
      setAnalysis(result);
      return result;
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI analysis failed.");
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  const insertDraft = (part: "findings" | "impression" | "both", source = analysis) => {
    const draft = source?.draft;
    if (!draft) return;

    const replacing =
      (part !== "impression" && findingsRef.current.trim()) ||
      (part !== "findings" && impressionRef.current.trim());
    if (replacing && !window.confirm("Replace the text in the report editor with the AI draft?")) {
      return;
    }

    if (part !== "impression") setFindings(draft.findings);
    if (part !== "findings") setImpression(draft.impression);
    setSaved(false);
  };

  const generateReport = async () => {
    const result = analysis ?? (await runAnalysis());
    if (result) insertDraft("both", result);
  };

  const sendMessage = async (text = chatInput) => {
    const trimmed = text.trim();
    if (!trimmed || !study || chatSending) return;

    if (!(await ensureAiReady())) {
      setChatMessages((current) => [
        ...current,
        { role: "user", text: trimmed },
        { role: "assistant", text: AI_NOT_CONFIGURED },
      ]);
      setChatInput("");
      return;
    }

    setChatSending(true);
    setChatInput("");
    setChatMessages((current) => [...current, { role: "user", text: trimmed }]);

    try {
      const id =
        conversationId ??
        (await createConversation({ study_id: study.id, title: `${study.patient} · ${study.description}` })).id;
      setConversationId(id);

      const conversation = await sendAiMessage(id, trimmed);
      setChatMessages(
        (conversation.messages ?? []).map((item) => ({ role: item.role, text: item.content })),
      );
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: error instanceof Error ? error.message : "The AI could not answer. Try again.",
        },
      ]);
    } finally {
      setChatSending(false);
    }
  };

  const compareStudy = () =>
    sendMessage("Compare this study with any previous studies of this patient in the context.");

  const useTemplate = () => {
    if (
      (findings.trim() || impression.trim()) &&
      !window.confirm("Replace the current findings and impression with the template?")
    ) {
      return;
    }

    setFindings(
      "Technique:\n\nComparison:\n\nFindings:\n",
    );

    setImpression("");

    setSaved(false);
  };

  const saveDraft = async () => {
    if (!study || saving || draftLoading || draftLoadError) return;
    const sentFindings = findings;
    const sentImpression = impression;
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch("/api/v1/reports/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          study_id: study.id,
          findings: sentFindings,
          impression: sentImpression,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Save failed (${response.status})`);
      }

      await response.json();
      setSaved(
        findingsRef.current === sentFindings && impressionRef.current === sentImpression,
      );
      setFinalizedReportId(null);
    } catch (error) {
      console.error("Could not save report draft:", error);
      window.alert("Could not save the draft. Check that the backend is running and try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFullscreen = () => {
    setFullscreen((current) => !current);
  };

  if (studiesLoading || studiesError || !study) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#090b12] px-6 text-center">
        {studiesLoading ? (
          <p className="text-sm text-white/50">Loading workspace...</p>
        ) : (
          <>
            <h1 className="text-base font-semibold text-white">
              {studiesError ? "Workspace unavailable" : "Study not found"}
            </h1>
            <p className="mt-1 max-w-sm text-sm text-white/35">
              {studiesError ||
                (studies.length === 0
                  ? "No studies exist yet. Import studies to start reviewing."
                  : `No study matches ${studyId}.`)}
            </p>
            <button
              onClick={() => navigate("/studies")}
              className="mt-5 flex h-9 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft size={15} />
              Back to Studies
            </button>
          </>
        )}
      </div>
    );
  }

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
                {patientDetails?.mrn ?? study.patientId}
              </span>
            </div>

            <div className="mt-1 text-[11px] text-white/40">
              {patientDetails
                ? `${patientDetails.gender} · ${
                    patientDetails.age === null ? "Age unavailable" : `${patientDetails.age}Y`
                  } · ${patientDetails.dob}`
                : "Loading patient details..."}
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
            onClick={() => {
              setShowSeries(false);
              setShowStudies((current) => !current);
            }}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.06] hover:text-white"
          >
            View All Studies
            <ChevronDown
              size={14}
              className={`transition ${
                showStudies ? "rotate-180" : ""
              }`}
            />
          </button>

          {showStudies && (
            <div className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-white/10 bg-[#11141c] p-2 shadow-2xl">
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-white/25">
                Studies
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
                .slice(0, 6)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setShowStudies(false);
                      if (item.id === study.id) return;
                      if (
                        !saved &&
                        (findings.trim() || impression.trim()) &&
                        !window.confirm("You have unsaved report text. Leave this study without saving?")
                      ) {
                        return;
                      }
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
              {viewerUrl ? (
                <>
                  {/* OHIF DICOM viewer (has its own tools) */}
                  <iframe
                    key={viewerUrl}
                    title="Medic DICOM Viewer"
                    src={viewerUrl}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="fullscreen"
                    allowFullScreen
                  />

                  <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-xl border border-white/10 bg-[#11141c]/90 p-1 shadow-lg backdrop-blur">
                    <a
                      href={viewerUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open viewer in a new tab"
                      className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      <ExternalLink size={15} />
                    </a>

                    <button
                      onClick={toggleFullscreen}
                      title={fullscreen ? "Exit fullscreen" : "Fullscreen workspace"}
                      className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      <Maximize2 size={15} />
                    </button>
                  </div>

                  {ohifUnreachable && (
                    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-amber-400/20 bg-[#11141c]/95 px-3 py-2 text-xs text-amber-200/80 shadow-lg">
                      <span>
                        Viewer not loading? Start the OHIF relay (scripts\start-medic.ps1) and
                        check Tailscale.
                      </span>
                      <button
                        onClick={() => setOhifUnreachable(false)}
                        className="text-white/40 transition hover:text-white"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </>
              ) : (
              <>
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

              </div>

              {/* Series selector */}

              <div className="absolute bottom-10 left-4 z-10">
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowStudies(false);
                      setShowSeries((current) => !current);
                    }}
                    disabled={!seriesList}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#11141c]/90 px-3 py-2 text-xs text-white/55 backdrop-blur transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="max-w-40 truncate">
                      {seriesList?.[selectedSeries]?.name ?? "No series"}
                    </span>
                    <ChevronDown size={13} />
                  </button>

                  {showSeries && seriesList && (
                    <div className="absolute bottom-11 left-0 z-30 w-56 rounded-xl border border-white/10 bg-[#11141c] p-2 shadow-2xl">
                      {seriesList.map((series, index) => (
                        <button
                          key={series.uid}
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
                          {series.name}
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

                  <div className="absolute bottom-4 left-0 right-0 px-4 text-center text-[10px] font-mono text-white/25">
                    {totalImages > 0
                      ? "DICOM VIEWER PREVIEW"
                      : "NO IMAGES IMPORTED FOR THIS STUDY YET"}
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
                  Image {totalImages > 0 ? imageIndex : 0} / {totalImages}
                </span>

                <button
                  onClick={() => changeImage(1)}
                  disabled={imageIndex >= totalImages}
                  className="rounded-md p-1 text-white/45 transition hover:bg-white/10 hover:text-white disabled:opacity-20"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              </>
              )}
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

                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                        !aiReady
                          ? "bg-white/5 text-white/35"
                          : analysis?.draft
                            ? "bg-amber-400/10 text-amber-300"
                            : "bg-emerald-400/10 text-emerald-300"
                      }`}
                    >
                      {!aiReady ? "Not configured" : analysis?.draft ? "Draft · review required" : "Ready"}
                    </span>
                  </div>

                  <p
                    className={`mt-1 truncate text-xs ${aiError ? "text-red-300/80" : "text-white/40"}`}
                    title={analysis?.draft?.impression}
                  >
                    {analyzing
                      ? "Analyzing representative slices... this can take up to a minute."
                      : aiError ||
                        (analysis?.draft
                          ? analysis.draft.impression
                          : study.studyInstanceUid
                            ? "Run Analyze for an AI draft of findings and impression."
                            : "Import images for this study to enable AI analysis.")}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {analysis?.draft && (
                    <button
                      onClick={() => insertDraft("both")}
                      className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-white/60 transition hover:bg-white/5 hover:text-white"
                      title="Copy the AI draft into the report editor for review"
                    >
                      Insert into report
                    </button>
                  )}

                  <button
                    onClick={() => void runAnalysis()}
                    disabled={analyzing || !study.studyInstanceUid}
                    className="rounded-lg border border-[#7047ff]/20 bg-[#7047ff]/10 px-3 py-2 text-[10px] text-[#b9aaff] transition hover:bg-[#7047ff]/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {analyzing ? "Analyzing..." : analysis?.draft ? "Re-analyze" : "Analyze"}
                  </button>
                </div>
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
                  {aiReady ? `${aiStatus?.model} · ${study.id}` : `Not configured · ${study.id}`}
                </div>
              </div>

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
                  Reviewing {study.patient}'s {study.description}.{" "}
                  {aiReady
                    ? "AI suggestions are drafts: review and edit everything before it goes into the report."
                    : "AI is not configured yet. Start the backend with an Anthropic API key to enable analysis and chat."}
                </p>
              </div>

              {analysis?.draft && (
                <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[0.03] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-amber-200/90">AI draft · review required</div>
                    <div className="text-[10px] text-white/30">
                      {analysis.model} · {formatAiTime(analysis.completed_at)}
                    </div>
                  </div>

                  <div className="mt-3 text-[10px] uppercase tracking-wider text-white/30">Findings</div>
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-white/60">
                    {analysis.draft.findings}
                  </p>

                  <div className="mt-3 text-[10px] uppercase tracking-wider text-white/30">Impression</div>
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-white/70">
                    {analysis.draft.impression}
                  </p>

                  {analysis.observations.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {analysis.observations.map((item, index) => (
                        <div key={`${item.title}-${index}`} className="flex items-start gap-2 text-[11px]">
                          <span
                            className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase ${
                              item.significance === "urgent"
                                ? "bg-red-400/15 text-red-300"
                                : item.significance === "needs_attention"
                                  ? "bg-amber-400/15 text-amber-300"
                                  : "bg-white/5 text-white/40"
                            }`}
                          >
                            {(item.significance ?? "note").replace("_", " ")}
                          </span>
                          <span className="text-white/55">
                            <span className="text-white/75">{item.title}</span>
                            {item.body_region ? ` · ${item.body_region}` : ""}
                            {item.confidence !== null ? ` · ${Math.round(item.confidence * 100)}%` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-3 text-[10px] leading-4 text-white/30">
                    {analysis.draft.limitations}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["findings", "impression", "both"] as const).map((part) => (
                      <button
                        key={part}
                        onClick={() => insertDraft(part)}
                        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-white/60 transition hover:bg-white/5 hover:text-white"
                      >
                        {part === "both" ? "Insert both" : `Insert ${part}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.length > 0 && (
                <div className="mt-4 space-y-2">
                  {chatMessages.map((item, index) => (
                    <div
                      key={`${item.role}-${index}`}
                      className={`whitespace-pre-wrap rounded-xl p-3 text-xs leading-5 ${
                        item.role === "user"
                          ? "ml-6 bg-[#7047ff]/15 text-white/75"
                          : "mr-3 border border-white/10 bg-white/[0.025] text-white/60"
                      }`}
                    >
                      {item.text}
                    </div>
                  ))}

                  {chatSending && (
                    <div className="mr-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs text-white/35">
                      Thinking...
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => void runAnalysis()}
                  disabled={analyzing || !study.studyInstanceUid}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.015] px-3 py-2.5 text-left text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {analyzing ? "Analyzing study..." : "Analyze Study"}
                </button>

                <button
                  onClick={() => void compareStudy()}
                  disabled={chatSending}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.015] px-3 py-2.5 text-left text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
                >
                  Compare Previous Study
                </button>

                <button
                  onClick={() => void generateReport()}
                  disabled={analyzing || !study.studyInstanceUid}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.015] px-3 py-2.5 text-left text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  title="Analyze if needed, then copy the AI draft into the report editor for review"
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
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask anything about this study..."
                  className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25"
                />

                <button
                  onClick={() => void sendMessage()}
                  disabled={!chatInput.trim() || chatSending}
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

              {draftLoadError && (
                <span className="rounded-md bg-red-400/10 px-2 py-1 text-[10px] text-red-300">
                  {draftLoadError}
                </span>
              )}

              {finalizedReportId && (
                <span className="flex items-center gap-2 rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
                  Report {finalizedReportId} is finalized
                  <button
                    onClick={() => navigate(`/reports/${finalizedReportId}`)}
                    className="underline decoration-emerald-300/40 underline-offset-2 hover:text-emerald-200"
                  >
                    Open report
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={useTemplate}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/45 transition hover:bg-white/5 hover:text-white"
              >
                Templates
              </button>

              <button
                onClick={() => void saveDraft()}
                disabled={saving || draftLoading || Boolean(draftLoadError)}
                className="flex items-center gap-2 rounded-lg bg-[#7047ff] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#805cff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saved && <Check size={13} />}
                {saving ? "Saving..." : saved ? "Saved" : finalizedReportId ? "Save new draft" : "Save Draft"}
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
                disabled={draftLoading || Boolean(draftLoadError)}
                placeholder={draftLoading ? "Loading draft..." : "Document imaging findings..."}
                className="mt-2 min-h-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-white outline-none placeholder:text-white/20 transition focus:border-[#7047ff]/50 disabled:opacity-60"
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
                disabled={draftLoading || Boolean(draftLoadError)}
                placeholder={draftLoading ? "Loading draft..." : "Enter impression..."}
                className="mt-2 min-h-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-white outline-none placeholder:text-white/20 transition focus:border-[#7047ff]/50 disabled:opacity-60"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Workspace;