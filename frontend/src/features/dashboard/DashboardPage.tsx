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

const summaryCards = [
  {
    label: "Studies Today",
    value: "24",
    detail: "6 pending review",
    icon: ScanLine,
  },
  {
    label: "Patients",
    value: "128",
    detail: "12 added this week",
    icon: Users,
  },
  {
    label: "Reports",
    value: "18",
    detail: "4 drafts awaiting review",
    icon: FileText,
  },
  {
    label: "AI Analyses",
    value: "31",
    detail: "Across 19 studies",
    icon: Activity,
  },
];

const recentStudies = [
  {
    patient: "John Doe",
    study: "MRI Brain w/ Contrast",
    modality: "MR",
    date: "Today, 10:42 AM",
    status: "Review",
  },
  {
    patient: "Emily Carter",
    study: "CT Chest",
    modality: "CT",
    date: "Today, 09:18 AM",
    status: "AI Analysis",
  },
  {
    patient: "Michael Wilson",
    study: "MRI Knee",
    modality: "MR",
    date: "Yesterday, 04:36 PM",
    status: "Reported",
  },
  {
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
  },
  {
    title: "Studies pending analysis",
    detail: "6 studies have not been reviewed yet",
    count: "6",
    icon: AlertCircle,
  },
  {
    title: "Follow-up studies",
    detail: "3 patients have previous studies available",
    count: "3",
    icon: CalendarDays,
  },
];

function DashboardPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
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
              <div
                key={card.label}
                className="rounded-2xl border border-white/10 bg-[#0d1018] p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7047ff]/15 text-[#9b7cff]">
                    <Icon size={19} strokeWidth={1.8} />
                  </div>

                  <ArrowUpRight
                    size={16}
                    className="text-white/20"
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
              </div>
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

              <button className="text-xs text-[#9b7cff] hover:text-white">
                View all
              </button>
            </div>

            <div>
              {recentStudies.map((study) => (
                <div
                  key={`${study.patient}-${study.study}`}
                  className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 last:border-b-0 hover:bg-white/[0.02]"
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
                    <span className="text-xs text-white/30">
                      {study.date}
                    </span>

                    <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs text-white/55">
                      {study.status}
                    </span>
                  </div>
                </div>
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
            <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.04]">
              <ScanLine size={18} className="text-[#9b7cff]" />

              <div>
                <div className="text-sm font-medium text-white/80">
                  Open Workspace
                </div>

                <div className="mt-1 text-xs text-white/30">
                  Review an imaging study
                </div>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.04]">
              <ClipboardList size={18} className="text-[#9b7cff]" />

              <div>
                <div className="text-sm font-medium text-white/80">
                  Create Report
                </div>

                <div className="mt-1 text-xs text-white/30">
                  Start a new report draft
                </div>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.04]">
              <Users size={18} className="text-[#9b7cff]" />

              <div>
                <div className="text-sm font-medium text-white/80">
                  Find Patient
                </div>

                <div className="mt-1 text-xs text-white/30">
                  Search patient records
                </div>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;