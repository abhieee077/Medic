
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchReports, type Report } from "../reports/reportApi";

const API_BASE = "/api/v1";

type ApiPatient = {
  patient_id: string;
  mrn: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
};

type ApiStudy = {
  study_id: string;
  study_description: string | null;
  study_date: string | null;
  modality: string | null;
  status: string | null;
  patient: {
    patient_id: string;
    full_name: string;
  };
};

function formatDate(date: string | null): string {
  if (!date) return "Not available";

  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Not available";

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
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function PatientDetailPage() {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [studies, setStudies] = useState<ApiStudy[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsError, setReportsError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      if (!patientId) {
        setError("No patient ID was provided.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const [patientResponse, studiesResponse] = await Promise.all([
          fetch(
            `${API_BASE}/patients/${encodeURIComponent(patientId)}`,
            { signal: controller.signal },
          ),
          fetch(`${API_BASE}/studies/`, { signal: controller.signal }),
        ]);

        if (!patientResponse.ok) {
          if (patientResponse.status === 404) {
            throw new Error("Patient not found.");
          }
          throw new Error(`Patient request failed (${patientResponse.status}).`);
        }

        if (!studiesResponse.ok) {
          throw new Error(`Studies request failed (${studiesResponse.status}).`);
        }

        const patientData: ApiPatient = await patientResponse.json();
        const studiesData: { items: ApiStudy[]; total: number } =
          await studiesResponse.json();

        if (!controller.signal.aborted) {
          setPatient(patientData);
          setStudies(
            studiesData.items
              .filter(
                (study) => study.patient.patient_id === patientData.patient_id,
              )
              .sort((a, b) =>
                (b.study_date ?? "").localeCompare(a.study_date ?? ""),
              ),
          );
        }

        // Reports are secondary; a failure here should not hide the patient.
        try {
          const allReports = await fetchReports();
          if (!controller.signal.aborted) {
            setReports(
              allReports.filter((report) => report.patientId === patientData.patient_id),
            );
            setReportsError("");
          }
        } catch {
          if (!controller.signal.aborted) {
            setReportsError("Reports could not be loaded.");
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Unable to load patient data.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadData();
    return () => controller.abort();
  }, [patientId]);

  const latestStudy = studies[0] ?? null;
  const age = calculateAge(patient?.date_of_birth ?? null);
  const initials =
    patient?.full_name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "?";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      <div className="border-b border-white/10 px-6 py-5">
        <button
          onClick={() => navigate("/patients")}
          className="mb-4 flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Patients
        </button>

        {isLoading ? (
          <p className="text-sm text-white/50">Loading patient...</p>
        ) : error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {error}
            <button
              onClick={() => navigate("/patients")}
              className="ml-3 underline"
            >
              Return to patients
            </button>
          </div>
        ) : patient ? (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7047ff]/15 text-lg font-semibold text-[#9b7cff]">
                {initials}
              </div>

              <div>
                <h1 className="text-xl font-semibold text-white">
                  {patient.full_name}
                </h1>
                <p className="mt-1 text-sm text-white/40">
                  {patient.patient_id} · MRN {patient.mrn}
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                latestStudy
                  ? navigate(`/workspace/${latestStudy.study_id}`)
                  : undefined
              }
              disabled={!latestStudy}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ImageIcon size={17} />
              Open Latest Study
            </button>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        {patient && !error && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-white/35">
                  <UserRound size={14} />
                  Demographics
                </div>
                <div className="text-sm text-white/75">
                  {age === null ? "Age unavailable" : `${age} years`} ·{" "}
                  {patient.gender || "Not specified"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
                <div className="mb-2 text-xs text-white/35">Date of Birth</div>
                <div className="text-sm text-white/75">
                  {formatDate(patient.date_of_birth)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
                <div className="mb-2 text-xs text-white/35">Phone</div>
                <div className="text-sm text-white/75">
                  {patient.phone || "Not provided"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-white/35">
                  <CalendarDays size={14} />
                  Last Study
                </div>
                <div className="text-sm text-white/75">
                  {latestStudy
                    ? latestStudy.study_date
                      ? formatDate(latestStudy.study_date)
                      : "Date unavailable"
                    : "No studies"}
                </div>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Study History
                </h2>
                <p className="mt-1 text-sm text-white/35">
                  Imaging studies associated with this patient.
                </p>
              </div>
              <span className="text-sm text-white/35">
                {studies.length} {studies.length === 1 ? "study" : "studies"}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1018]">
              <div className="grid min-w-[700px] grid-cols-[1.5fr_1.3fr_90px_110px_60px] border-b border-white/10 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-white/30">
                <span>Study</span>
                <span>Date</span>
                <span>Modality</span>
                <span>Status</span>
                <span />
              </div>

              {studies.length > 0 ? (
                studies.map((study) => (
                  <div
                    key={study.study_id}
                    className="group grid min-w-[700px] grid-cols-[1.5fr_1.3fr_90px_110px_60px] items-center border-b border-white/[0.06] px-5 py-4 transition hover:bg-white/[0.025] last:border-b-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-white/85">
                        {study.study_description || "Untitled study"}
                      </div>
                      <div className="mt-0.5 text-xs text-white/35">
                        {study.study_id}
                      </div>
                    </div>

                    <span className="text-sm text-white/55">
                      {study.study_date ? formatDate(study.study_date) : "Date unavailable"}
                    </span>

                    <span className="w-fit rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white/60">
                      {study.modality || "Unknown"}
                    </span>

                    <div>
                      <span className="rounded-lg bg-blue-400/10 px-2.5 py-1 text-xs font-medium text-blue-300">
                        {study.status || "Available"}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/workspace/${study.study_id}`)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
                      title="Open study"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex min-h-32 items-center justify-center px-6 text-sm text-white/40">
                  No studies are linked to this patient yet.
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-white">
                  Recent Reports
                </h2>
                <p className="mt-1 text-sm text-white/35">
                  Reports associated with this patient's imaging history.
                </p>
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
                          <div className="truncate text-sm font-medium text-white/85">
                            {report.study}
                          </div>
                          <div className="mt-0.5 text-xs text-white/35">
                            {report.id} · {report.studyId} · Updated {report.updatedAt}
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
                      <div className="text-sm font-medium text-white/80">
                        {reportsError || "No reports yet"}
                      </div>
                      <div className="mt-0.5 text-xs text-white/35">
                        {reportsError
                          ? "Check that the backend is running."
                          : "Reports drafted for this patient's studies will appear here."}
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

export default PatientDetailPage;
