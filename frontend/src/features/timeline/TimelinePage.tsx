import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  FolderOpen,
  Search,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type TimelineEvent = {
  id: string;
  type: "study" | "report" | "patient" | "upload";
  title: string;
  description: string;
  patient: string;
  studyId?: string;
  date: string;
  time: string;
};

const events: TimelineEvent[] = [
  {
    id: "EV-001",
    type: "report",
    title: "Report finalized",
    description: "MRI Brain w/ Contrast report finalized",
    patient: "John Doe",
    studyId: "ST-00192",
    date: "Apr 20, 2025",
    time: "10:42 AM",
  },
  {
    id: "EV-002",
    type: "study",
    title: "Study analyzed",
    description: "AI analysis completed for MRI Brain w/ Contrast",
    patient: "John Doe",
    studyId: "ST-00192",
    date: "Apr 20, 2025",
    time: "10:18 AM",
  },
  {
    id: "EV-003",
    type: "upload",
    title: "Study uploaded",
    description: "MRI Brain w/ Contrast uploaded to workspace",
    patient: "John Doe",
    studyId: "ST-00192",
    date: "Apr 20, 2025",
    time: "9:56 AM",
  },
  {
    id: "EV-004",
    type: "study",
    title: "Study analyzed",
    description: "CT Chest analysis completed",
    patient: "Emily Carter",
    studyId: "ST-00191",
    date: "Apr 18, 2025",
    time: "3:21 PM",
  },
  {
    id: "EV-005",
    type: "report",
    title: "Report finalized",
    description: "CT Chest report finalized",
    patient: "Emily Carter",
    studyId: "ST-00191",
    date: "Apr 18, 2025",
    time: "3:45 PM",
  },
  {
    id: "EV-006",
    type: "patient",
    title: "Patient added",
    description: "New patient record created",
    patient: "Sophia Martinez",
    date: "Apr 11, 2025",
    time: "11:05 AM",
  },
  {
    id: "EV-007",
    type: "upload",
    title: "Study uploaded",
    description: "CT Head uploaded to workspace",
    patient: "Sophia Martinez",
    studyId: "ST-00189",
    date: "Apr 11, 2025",
    time: "11:18 AM",
  },
];

const filters = [
  { label: "All events", value: "all" },
  { label: "Studies", value: "study" },
  { label: "Reports", value: "report" },
  { label: "Patients", value: "patient" },
  { label: "Uploads", value: "upload" },
];

function TimelinePage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesFilter =
        filter === "all" || event.type === filter;

      const matchesSearch =
        !query ||
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.patient.toLowerCase().includes(query) ||
        event.studyId?.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const grouped = useMemo(() => {
    return filteredEvents.reduce<Record<string, TimelineEvent[]>>(
      (result, event) => {
        if (!result[event.date]) result[event.date] = [];
        result[event.date].push(event);
        return result;
      },
      {},
    );
  }, [filteredEvents]);

  const iconFor = (type: TimelineEvent["type"]) => {
    if (type === "study") return FolderOpen;
    if (type === "report") return FileText;
    if (type === "patient") return UserRound;
    return Upload;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">
              Timeline
            </h1>

            <p className="mt-1 text-sm text-white/35">
              Track activity across patients, studies, and reports.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/30">
            <Clock3 size={14} />
            Recent activity
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="flex h-9 min-w-64 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3">
            <Search size={14} className="text-white/25" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search timeline"
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-white/25 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.025] p-1">
            <Filter size={13} className="mx-2 text-white/25" />

            {filters.map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`rounded-lg px-3 py-1.5 text-[11px] transition ${
                  filter === item.value
                    ? "bg-[#7047ff]/15 text-[#b6a5ff]"
                    : "text-white/35 hover:bg-white/5 hover:text-white/65"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-4xl">
          {filteredEvents.length === 0 ? (
            <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white/25">
                <CalendarDays size={20} />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-white">
                No timeline events found
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Try changing your search or event filter.
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(
              ([date, dateEvents]) => (
                <section key={date} className="mb-8">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="text-xs font-semibold text-white/50">
                      {date}
                    </div>

                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>

                  <div className="relative ml-3 border-l border-white/10 pl-8">
                    {dateEvents.map((event) => {
                      const Icon = iconFor(event.type);

                      return (
                        <div
                          key={event.id}
                          className="relative mb-6 last:mb-0"
                        >
                          <div className="absolute -left-[45px] top-0 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0d1018] text-[#a990ff]">
                            <Icon size={14} />
                          </div>

                          <button
                            onClick={() => {
                              if (event.studyId) {
                                navigate(
                                  `/studies/${event.studyId}`,
                                );
                              } else {
                                navigate("/patients");
                              }
                            }}
                            className="w-full rounded-2xl border border-white/10 bg-[#0d1018] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.025]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-medium text-white/80">
                                    {event.title}
                                  </h3>

                                  {event.type === "report" && (
                                    <CheckCircle2
                                      size={13}
                                      className="text-emerald-400/70"
                                    />
                                  )}
                                </div>

                                <p className="mt-1 text-xs text-white/35">
                                  {event.description}
                                </p>

                                <div className="mt-3 flex items-center gap-2 text-[11px] text-white/25">
                                  <UserRound size={12} />
                                  {event.patient}

                                  {event.studyId && (
                                    <>
                                      <span>·</span>
                                      <span>{event.studyId}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <span className="shrink-0 text-[11px] text-white/20">
                                {event.time}
                              </span>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default TimelinePage;