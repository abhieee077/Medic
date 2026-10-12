import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  FileText,
  Image,
  Plus,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchReports, type Report } from "../reports/reportApi";

const API_BASE = "/api/v1";

type ApiStudy = {
  study_id: string;
  study_description: string | null;
  modality: string | null;
  study_date: string | null;
  status: string | null;
  accession_number: string | null;
  patient: {
    patient_id: string;
    full_name: string;
  };
};

type ApiSeries = {
  series_instance_uid: string;
  series_number: number | null;
  series_description: string | null;
  modality: string | null;
  body_part: string | null;
  number_of_instances: number | null;
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

function formatStatus(status: string | null): string {
  if (!status) return "Available";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function StudyDetailPage() {
  const navigate = useNavigate();
  const { studyId } = useParams();

  const [study, setStudy] = useState<ApiStudy | null>(null);
  const [mrn, setMrn] = useState("");
  const [series, setSeries] = useState<ApiSeries[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingReport, setCreatingReport] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function loadData() {
      if (!studyId) {
        setError("No study ID was provided.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const studyResponse = await fetch(
          `${API_BASE}/studies/${encodeURIComponent(studyId)}`,
          { signal },
        );

        if (!studyResponse.ok) {
          throw new Error(
            studyResponse.status === 404
              ? "Study not found."
              : `Study request failed (${studyResponse.status}).`,
          );
        }

        const studyData: ApiStudy = await studyResponse.json();
        if (signal.aborted) return;
        setStudy(studyData);

        // Series, MRN and reports are secondary: show the study even if they fail.
        const [seriesResult, patientResult, reportsResult] = await Promise.allSettled([
          fetch(`${API_BASE}/studies/${encodeURIComponent(studyId)}/series`, { signal })
            .then((response) => (response.ok ? response.json() : { items: [] })),
          fetch(
            `${API_BASE}/patients/${encodeURIComponent(studyData.patient.patient_id)}`,
            { signal },
          ).then((response) => (response.ok ? response.json() : null)),
          fetchReports(),
        ]);

        if (signal.aborted) return;

        setSeries(seriesResult.status === "fulfilled" ? seriesResult.value.items ?? [] : []);
        setMrn(
          patientResult.status === "fulfilled" && patientResult.value?.mrn
            ? `MRN ${patientResult.value.mrn}`
            : "",
        );
        setReports(
          reportsResult.status === "fulfilled"
            ? reportsResult.value.filter((report) => report.studyId === studyData.study_id)
            : [],
        );
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to load study.");
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    }

    void loadData();
    return () => controller.abort();
  }, [studyId]);

  const totalImages = series.reduce(
    (sum, item) => sum + (item.number_of_instances ?? 0),
    0,
  );

  const createReport = async () => {
    if (!study) return;

    setCreatingReport(true);
    try {
      const response = await fetch(`${API_BASE}/reports/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study_id: study.study_id, findings: "", impression: "" }),
      });
      if (!response.ok) throw new Error(`Failed to create draft (${response.status})`);

      const created = await response.json();
      navigate(`/reports/${created.report_id}`);
    } catch (err) {
      console.error("Could not create report:", err);
      window.alert("Could not create the draft. Check that the backend is running.");
    } finally {
      setCreatingReport(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      <div className="border-b border-white/10 px-6 py-5">
        <button
          onClick={() => navigate("/studies")}
          className="mb-4 flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Studies
        </button>

        {isLoading ? (
          <p className="text-sm text-white/50">Loading study...</p>
        ) : error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {error}
            <button onClick={() => navigate("/studies")} className="ml-3 underline">
              Return to studies
            </button>
          </div>
        ) : study ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white/55">
                  {study.modality || "Unknown"}
                </span>

                <span className="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  {formatStatus(study.status)}
                </span>
              </div>

              <h1 className="text-xl font-semibold text-white">
                {study.study_description || "Untitled study"}
              </h1>

              <p className="mt-1 text-sm text-white/40">
                {study.study_id} · {study.accession_number || "No accession number"}
              </p>
            </div>

            <button
              onClick={() => navigate(`/workspace/${study.study_id}`)}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]"
            >
              <Image size={17} />
              Open Workspace
            </button>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        {study && !error && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <button
                onClick={() => navigate(`/patients/${study.patient.patient_id}`)}
                className="rounded-2xl border border-white/10 bg-[#0d1018] p-4 text-left transition hover:bg-white/[0.035]"
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-white/35">
                  <UserRound size={14} />
                  Patient
                </div>
                <div className="text-sm text-[#a990ff]">{study.patient.full_name}</div>
                <div className="mt-1 text-xs text-white/35">
                  {mrn || study.patient.patient_id}
                </div>
              </button>

              <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-white/35">
                  <CalendarDays size={14} />
                  Study Date
                </div>
                <div className="text-sm text-white/75">{formatDate(study.study_date)}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
                <div className="mb-2 text-xs text-white/35">Series</div>
                <div className="text-sm text-white/75">{series.length}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
                <div className="mb-2 text-xs text-white/35">Images</div>
                <div className="text-sm text-white/75">{totalImages}</div>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-base font-semibold text-white">Series</h2>
              <p className="mt-1 text-sm text-white/35">
                Imaging series included in this study.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1018]">
              {series.length > 0 ? (
                series.map((item, index) => (
                  <div
                    key={item.series_instance_uid}
                    className="group flex items-center justify-between border-b border-white/[0.06] px-5 py-4 transition hover:bg-white/[0.025] last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7047ff]/10 text-sm font-medium text-[#9b7cff]">
                        {item.series_number ?? index + 1}
                      </div>

                      <div>
                        <div className="text-sm font-medium text-white/80">
                          {item.series_description || `Series ${index + 1}`}
                        </div>
                        <div className="mt-0.5 text-xs text-white/35">
                          {[item.modality, item.body_part].filter(Boolean).join(" · ") ||
                            "No additional metadata"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <span className="text-sm text-white/45">
                        {item.number_of_instances ?? 0} images
                      </span>

                      <button
                        onClick={() => navigate(`/workspace/${study.study_id}`)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
                        title="Open series"
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex min-h-32 flex-col items-center justify-center px-6 text-center">
                  <p className="text-sm text-white/55">No series imported yet.</p>
                  <p className="mt-1 text-xs text-white/30">
                    Series appear here once DICOM images are imported from Orthanc.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Report</h2>
                  <p className="mt-1 text-sm text-white/35">
                    Reports associated with this study.
                  </p>
                </div>

                {!reports.some((report) => report.status === "Draft") && (
                  <button
                    onClick={() => void createReport()}
                    disabled={creatingReport}
                    className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                  >
                    <Plus size={14} />
                    {creatingReport ? "Creating..." : "Create Draft"}
                  </button>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1018]">
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => navigate(`/reports/${report.id}`)}
                      className="flex w-full items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4 text-left transition hover:bg-white/[0.025] last:border-b-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7047ff]/10 text-[#9b7cff]">
                          <FileText size={17} />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white/80">
                            {report.id}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-white/35">
                            Updated {report.updatedAt}
                            {report.impression ? ` · ${report.impression}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                            report.status === "Finalized"
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-amber-400/10 text-amber-300"
                          }`}
                        >
                          {report.status}
                        </span>
                        <ChevronRight size={17} className="text-white/35" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="flex items-center gap-3 p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-white/50">
                      <FileText size={17} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/80">No report yet</div>
                      <div className="mt-0.5 text-xs text-white/35">
                        Create a draft to start reporting on this study.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StudyDetailPage;
