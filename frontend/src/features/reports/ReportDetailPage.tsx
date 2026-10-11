import {
  ArrowLeft,
  Check,
  ExternalLink,
  FileText,
  Lock,
  Save,
  Unlock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchReports, formatDate, type Report } from "./reportApi";

function ReportDetailPage() {
  const navigate = useNavigate();
  const { reportId } = useParams();

  const [report, setReport] = useState<Report | null>(null);
  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setLoadError("");

      try {
        const reports = await fetchReports();
        const mapped = reports.find((item) => item.id === reportId);

        if (!mapped) {
          if (!cancelled) setLoadError("Report not found in the database.");
          return;
        }

        if (!cancelled) {
          setReport(mapped);
          setFindings(mapped.findings);
          setImpression(mapped.impression);
        }
      } catch (error) {
        console.error("Could not load report:", error);
        if (!cancelled) setLoadError("Could not load report. Check the backend.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReport();
    return () => {
      cancelled = true;
    };
  }, [reportId]);
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#090b12] text-sm text-white/50">
        Loading report...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#090b12] px-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white/30">
          <FileText size={21} />
        </div>
        <h1 className="text-base font-semibold text-white">Report not found</h1>
        <p className="mt-1 max-w-sm text-sm text-white/35">
          {loadError || "The requested report does not exist in the current workspace."}
        </p>
        <button
          onClick={() => navigate("/reports")}
          className="mt-5 flex h-9 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to Reports
        </button>
      </div>
    );
  }

  const isFinalized = report.status === "Finalized";

  const saveDraft = async () => {
    setSaved(false);

    try {
      const response = await fetch("/api/v1/reports/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_id: report.studyId,
          findings,
          impression,
        }),
      });

      if (!response.ok) {
        throw new Error(`Save failed (${response.status}): ${await response.text()}`);
      }

      const result = await response.json();

      setReport((current) =>
        current
          ? {
              ...current,
              findings,
              impression,
              updatedAt: formatDate(result.updated_at),
              status: "Draft",
            }
          : current,
      );

      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      console.error("Could not save report:", error);
      window.alert("Could not save the report. Please check the backend and try again.");
    }
  };

  const toggleFinalize = async () => {
    const reopening = isFinalized;

    const confirmed = window.confirm(
      reopening
        ? "Reopen this finalized report as a draft?"
        : "Finalize this report? You will not be able to save it as a draft afterward.",
    );

    if (!confirmed) return;

    try {
      const endpoint = reopening
        ? `/api/v1/reports/${encodeURIComponent(report.id)}/reopen`
        : `/api/v1/reports/${encodeURIComponent(report.id)}/finalize`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...(reopening ? {} : { body: JSON.stringify({ findings, impression }) }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Report update failed (${response.status}): ${message}`);
      }

      const result = await response.json();

      setReport((current) =>
        current
          ? {
              ...current,
              findings: result.findings ?? findings,
              impression: result.impression ?? impression,
              status: reopening ? "Draft" : "Finalized",
              updatedAt: formatDate(result.updated_at),
            }
          : current,
      );

      if (reopening) {
        setFindings(result.findings ?? findings);
        setImpression(result.impression ?? impression);
      }
    } catch (error) {
      console.error("Could not update report status:", error);
      window.alert(
        error instanceof Error
          ? error.message
          : "Could not update the report. Please try again.",
      );
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate("/reports")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/5 hover:text-white"
            title="Back to Reports"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold text-white">
                {report.id}
              </h1>

              <span
                className={`rounded-lg px-2 py-1 text-[11px] font-medium ${
                  isFinalized
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-amber-400/10 text-amber-300"
                }`}
              >
                {report.status}
              </span>
            </div>

            <p className="mt-0.5 truncate text-xs text-white/35">
              {report.patient} · {report.study}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/workspace/${report.studyId}`)}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/55 transition hover:bg-white/5 hover:text-white"
          >
            <ExternalLink size={14} />
            Workspace
          </button>

          <button
            onClick={saveDraft}
            disabled={isFinalized}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/55 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? "Saved" : "Save Draft"}
          </button>

          <button
            onClick={toggleFinalize}
            className={`flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium transition ${
              isFinalized
                ? "border border-white/10 text-white/55 hover:bg-white/5 hover:text-white"
                : "bg-[#7047ff] text-white hover:bg-[#805cff]"
            }`}
          >
            {isFinalized ? (
              <>
                <Unlock size={14} />
                Reopen Draft
              </>
            ) : (
              <>
                <Lock size={14} />
                Finalize Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_280px] gap-6 p-6">
          {/* Editor */}
          <div className="space-y-5">
            {/* Findings */}
            <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">
                  Clinical Findings
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Document the relevant imaging observations.
                </p>
              </div>

              <div className="p-5">
                <textarea
                  value={findings}
                  onChange={(event) => setFindings(event.target.value)}
                  disabled={isFinalized}
                  placeholder="Enter clinical findings..."
                  className="min-h-64 w-full resize-y rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/50 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </section>

            {/* Impression */}
            <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">
                  Impression
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Summarize the key diagnostic conclusion.
                </p>
              </div>

              <div className="p-5">
                <textarea
                  value={impression}
                  onChange={(event) => setImpression(event.target.value)}
                  disabled={isFinalized}
                  placeholder="Enter report impression..."
                  className="min-h-40 w-full resize-y rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/50 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </section>
          </div>

          {/* Report metadata */}
          <aside className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
              <div className="border-b border-white/10 px-4 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  Report Details
                </h2>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {/* Patient */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Patient
                  </div>

                  {report.patientId ? (
                    <button
                      onClick={() => navigate(`/patients/${report.patientId}`)}
                      className="mt-1 text-left text-sm text-[#a990ff] transition hover:text-[#c0b2ff]"
                    >
                      {report.patient}
                    </button>
                  ) : (
                    <div className="mt-1 text-sm text-white/75">
                      {report.patient}
                    </div>
                  )}

                  <div className="mt-0.5 text-xs text-white/35">
                    {report.mrn}
                  </div>
                </div>

                {/* Study */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Study
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/studies/${report.studyId}`)
                    }
                    className="mt-1 text-left text-sm text-[#a990ff] transition hover:text-[#c0b2ff]"
                  >
                    {report.study}
                  </button>

                  <div className="mt-0.5 text-xs text-white/35">
                    {report.studyId} · {report.modality}
                  </div>
                </div>

                {/* Author */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Author
                  </div>

                  <div className="mt-1 text-sm text-white/75">
                    {report.author}
                  </div>
                </div>

                {/* Created */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Created
                  </div>

                  <div className="mt-1 text-sm text-white/60">
                    {report.createdAt}
                  </div>
                </div>

                {/* Last Updated */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Last Updated
                  </div>

                  <div className="mt-1 text-sm text-white/60">
                    {report.updatedAt}
                  </div>
                </div>

                {/* Status */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Status
                  </div>

                  <div className="mt-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                        isFinalized
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-amber-400/10 text-amber-300"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Related study */}
            <button
              onClick={() => navigate(`/studies/${report.studyId}`)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#0d1018] px-4 py-3 text-left transition hover:bg-white/[0.035]"
            >
              <div>
                <div className="text-xs text-white/30">
                  Related Study
                </div>

                <div className="mt-1 text-sm text-white/70">
                  {report.studyId}
                </div>
              </div>

              <ExternalLink
                size={15}
                className="text-white/30"
              />
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ReportDetailPage;