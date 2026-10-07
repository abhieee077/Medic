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
import { useNavigate } from "react-router-dom";

const summaryCards = [
  {
    label: "Studies Today",
    value: "24",
    detail: "6 pending review",
    icon: ScanLine,
    path: "/studies",
  },
  {
    label: "Patients",
    value: "128",
    detail: "12 added this week",
    icon: Users,
    path: "/patients",
  },
  {
    label: "Reports",
    value: "18",
    detail: "4 drafts awaiting review",
    icon: FileText,
    path: "/reports",
  },
  {
    label: "AI Analyses",
    value: "31",
    detail: "Across 19 studies",
    icon: Activity,
    path: "/ai-chat",
  },
];

const recentStudies = [
  {
    id: "ST-00192",
    patient: "John Doe",
    study: "MRI Brain w/ Contrast",
    modality: "MR",
    date: "Today, 10:42 AM",
    status: "Review",
  },
  {
    id: "ST-00191",
    patient: "Emily Carter",
    study: "CT Chest",
    modality: "CT",
    date: "Today, 09:18 AM",
    status: "AI Analysis",
  },
  {
    id: "ST-00190",
    patient: "Michael Wilson",
    study: "MRI Knee",
    modality: "MR",
    date: "Yesterday, 04:36 PM",
    status: "Reported",
  },
  {
    id: "ST-00189",
    patient: "Sophia Martinez",
    study: "CT Head",
    modality: "CT",
    date: "Yesterday, 01:12 PM",
    status: "Draft",
  },
];

const attentionItems = [
  {
    title: "Reports awaiting review",
    detail: "4 draft reports need physician review",
    count: "4",
    icon: FileText,
    path: "/reports",
  },
  {
    title: "Studies pending analysis",
    detail: "6 studies have not been reviewed yet",
    count: "6",
    icon: AlertCircle,
    path: "/studies",
  },
  {
    title: "Follow-up studies",
    detail: "3 patients have previous studies available",
    count: "3",
    icon: CalendarDays,
    path: "/timeline",
  },
];

function DashboardPage() {
  const navigate = useNavigate();

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
          October 6, 2026
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto p-6">
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
                navigate("/workspace/ST-00192")
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