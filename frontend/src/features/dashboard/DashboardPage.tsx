import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  FileText,
  ScanLine,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchReports, type Report } from "../reports/reportApi";

type ApiPatient = { patient_id: string; created_at: string | null };

type ApiStudy = {
  study_id: string;
  study_description: string | null;
  modality: string | null;
  study_date: string | null;
  patient: { patient_id: string; full_name: string };
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function DashboardPage() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [studies, setStudies] = useState<ApiStudy[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function loadData() {
      try {
        const [patientsResponse, studiesResponse, reportList] = await Promise.all([
          fetch("/api/v1/patients/", { signal }),
          fetch("/api/v1/studies/", { signal }),
          fetchReports(),
        ]);

        if (!patientsResponse.ok || !studiesResponse.ok) {
          throw new Error("Dashboard data request failed");
        }

        const patientsData = await patientsResponse.json();
        const studiesData = await studiesResponse.json();
        if (signal.aborted) return;

        setPatients(patientsData.items ?? []);
        setStudies(studiesData.items ?? []);
        setReports(reportList);
      } catch (error) {
        if (signal.aborted) return;
        console.error("Could not load dashboard:", error);
        setLoadError("Live data could not be loaded. Check that the backend is running.");
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    }

    void loadData();
    return () => controller.abort();
  }, []);

  // Captured once so render stays pure.
  const [now] = useState(() => Date.now());
  const today = new Date(now).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const draftReports = reports.filter((report) => report.status === "Draft");
  const reportedStudyIds = new Set(reports.map((report) => report.studyId));
  const unreportedStudies = studies.filter((study) => !reportedStudyIds.has(study.study_id));
  const newPatients = patients.filter(
    (patient) => patient.created_at && now - new Date(patient.created_at).getTime() < WEEK_MS,
  );
  const studiesPerPatient = studies.reduce<Record<string, number>>((counts, study) => {
    counts[study.patient.patient_id] = (counts[study.patient.patient_id] ?? 0) + 1;
    return counts;
  }, {});
  const followUpPatients = Object.values(studiesPerPatient).filter((count) => count > 1).length;

  const value = (count: number) => (isLoading ? "…" : String(count));

  const summaryCards = [
    {
      label: "Studies",
      value: value(studies.length),
      detail: `${plural(unreportedStudies.length, "study", "studies")} without a report`,
      icon: ScanLine,
      path: "/studies",
    },
    {
      label: "Patients",
      value: value(patients.length),
      detail: `${newPatients.length} added this week`,
      icon: Users,
      path: "/patients",
    },
    {
      label: "Reports",
      value: value(reports.length),
      detail: `${plural(draftReports.length, "draft")} awaiting review`,
      icon: FileText,
      path: "/reports",
    },
    {
      label: "AI Analyses",
      value: "—",
      detail: "AI not connected yet",
      icon: Activity,
      path: "/ai-chat",
    },
  ];

  const recentStudies = [...studies]
    .sort(
      (a, b) =>
        (b.study_date ?? "").localeCompare(a.study_date ?? "") ||
        b.study_id.localeCompare(a.study_id),
    )
    .slice(0, 4)
    .map((study) => {
    const studyReports = reports.filter((report) => report.studyId === study.study_id);
    const status = studyReports.some((report) => report.status === "Draft")
      ? "Draft"
      : studyReports.length > 0
        ? "Reported"
        : "No report";

    return {
      id: study.study_id,
      patient: study.patient.full_name,
      study: study.study_description || "Untitled study",
      modality: study.modality || "—",
      date: study.study_date
        ? new Date(`${study.study_date.slice(0, 10)}T00:00:00`).toLocaleDateString()
        : "Date unavailable",
      status,
    };
  });

  const attentionItems = [
    {
      title: "Reports awaiting review",
      detail: `${plural(draftReports.length, "draft report")} ${
        draftReports.length === 1 ? "needs" : "need"
      } physician review`,
      count: value(draftReports.length),
      icon: FileText,
      path: "/reports",
    },
    {
      title: "Studies without a report",
      detail: `${plural(unreportedStudies.length, "study", "studies")} not yet reported`,
      count: value(unreportedStudies.length),
      icon: AlertCircle,
      path: "/studies",
    },
    {
      title: "Follow-up studies",
      detail: `${plural(followUpPatients, "patient")} with previous studies available`,
      count: value(followUpPatients),
      icon: CalendarDays,
      path: "/patients",
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-white/40">
            Overview of your imaging workspace and clinical activity.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/45">
          <CalendarDays size={15} />
          {today}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {loadError && (
          <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {loadError}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.label}
                onClick={() => navigate(card.path)}
                className="group rounded-2xl border border-white/10 bg-[#0d1018] p-5 text-left transition hover:border-white/15 hover:bg-white/[0.025]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7047ff]/15 text-[#9b7cff] transition group-hover:bg-[#7047ff]/20">
                    <Icon size={19} strokeWidth={1.8} />
                  </div>

                  <ArrowUpRight
                    size={16}
                    className="text-white/20 transition group-hover:text-[#9b7cff]"
                  />
                </div>

                <div className="mt-5">
                  <div className="text-2xl font-semibold text-white">
                    {card.value}
                  </div>

                  <div className="mt-1 text-sm text-white/60">
                    {card.label}
                  </div>

                  <div className="mt-2 text-xs text-white/30">
                    {card.detail}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main dashboard grid */}
        <div className="mt-5 grid grid-cols-[1.5fr_1fr] gap-5">
          {/* Recent studies */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1018]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Recent Studies
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Latest imaging studies in your workspace
                </p>
              </div>

              <button
                onClick={() => navigate("/studies")}
                className="text-xs text-[#9b7cff] transition hover:text-white"
              >
                View all
              </button>
            </div>

            <div>
              {!isLoading && recentStudies.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-white/40">
                  No studies yet.
                </div>
              )}

              {recentStudies.map((study) => (
                <button
                  key={study.id}
                  onClick={() =>
                    navigate(`/workspace/${study.id}`)
                  }
                  className="flex w-full items-center justify-between border-b border-white/[0.06] px-5 py-4 text-left transition last:border-b-0 hover:bg-white/[0.025]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/45">
                      <ScanLine size={17} />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">
                        {study.patient}
                      </div>

                      <div className="mt-0.5 truncate text-xs text-white/35">
                        {study.study} · {study.modality}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex shrink-0 items-center gap-5">
                    <span className="hidden text-xs text-white/30 lg:block">
                      {study.date}
                    </span>

                    <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs text-white/55">
                      {study.status}
                    </span>

                    <ArrowUpRight
                      size={14}
                      className="text-white/20"
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Needs attention */}
          <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-white">
                Needs Attention
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Items requiring your review
              </p>
            </div>

            <div className="p-3">
              {attentionItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    onClick={() => navigate(item.path)}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/[0.03]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7047ff]/10 text-[#9b7cff]">
                      <Icon size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white/80">
                        {item.title}
                      </div>

                      <div className="mt-1 text-xs text-white/30">
                        {item.detail}
                      </div>
                    </div>

                    <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white/55">
                      {item.count}
                    </span>

                    <ArrowUpRight
                      size={14}
                      className="text-white/20"
                    />
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Quick actions */}
        <section className="mt-5 rounded-2xl border border-white/10 bg-[#0d1018] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">
              Quick Actions
            </h2>

            <p className="mt-1 text-xs text-white/30">
              Common workspace actions
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() =>
                navigate("/workspace")
              }
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <ScanLine
                size={18}
                className="text-[#9b7cff]"
              />

              <div className="flex-1">
                <div className="text-sm font-medium text-white/80">
                  Open Workspace
                </div>

                <div className="mt-1 text-xs text-white/30">
                  Review an imaging study
                </div>
              </div>

              <ArrowUpRight
                size={14}
                className="text-white/20 transition group-hover:text-white/50"
              />
            </button>

            <button
              onClick={() => navigate("/reports")}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <ClipboardList
                size={18}
                className="text-[#9b7cff]"
              />

              <div className="flex-1">
                <div className="text-sm font-medium text-white/80">
                  Create Report
                </div>

                <div className="mt-1 text-xs text-white/30">
                  Start a new report draft
                </div>
              </div>

              <ArrowUpRight
                size={14}
                className="text-white/20 transition group-hover:text-white/50"
              />
            </button>

            <button
              onClick={() => navigate("/patients")}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <Users
                size={18}
                className="text-[#9b7cff]"
              />

              <div className="flex-1">
                <div className="text-sm font-medium text-white/80">
                  Find Patient
                </div>

                <div className="mt-1 text-xs text-white/30">
                  Search patient records
                </div>
              </div>

              <ArrowUpRight
                size={14}
                className="text-white/20 transition group-hover:text-white/50"
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;