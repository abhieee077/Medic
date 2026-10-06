import {
  Search,
  Upload,
  MoreHorizontal,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const studies = [
  {
    id: "ST-00192",
    patient: "John Doe",
    mrn: "MRN 987654",
    date: "Apr 20, 2025",
    description: "MRI Brain w/ Contrast",
    modality: "MR",
    series: 4,
    images: 192,
    status: "Ready",
  },
  {
    id: "ST-00191",
    patient: "Emily Carter",
    mrn: "MRN 987655",
    date: "Apr 18, 2025",
    description: "CT Chest",
    modality: "CT",
    series: 3,
    images: 156,
    status: "Ready",
  },
  {
    id: "ST-00190",
    patient: "Michael Wilson",
    mrn: "MRN 987656",
    date: "Apr 15, 2025",
    description: "MRI Knee",
    modality: "MR",
    series: 5,
    images: 248,
    status: "Analyzing",
  },
  {
    id: "ST-00189",
    patient: "Sophia Martinez",
    mrn: "MRN 987657",
    date: "Apr 11, 2025",
    description: "CT Head",
    modality: "CT",
    series: 2,
    images: 84,
    status: "Ready",
  },
  {
    id: "ST-00188",
    patient: "Daniel Brown",
    mrn: "MRN 987658",
    date: "Apr 09, 2025",
    description: "X-Ray Chest",
    modality: "CR",
    series: 1,
    images: 2,
    status: "Reported",
  },
];

function StudiesPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Studies</h1>
          <p className="mt-1 text-sm text-white/40">
            Browse imaging studies and open them in the workspace.
          </p>
        </div>

        <button className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]">
          <Upload size={17} />
          Upload Study
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-[360px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3">
              <Search size={17} className="text-white/35" />

              <input
                type="text"
                placeholder="Search patient, MRN, accession..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>

            <button className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white/55 transition hover:bg-white/5 hover:text-white">
              <Filter size={16} />
              Filters
            </button>
          </div>

          <div className="text-sm text-white/35">
            {studies.length} studies
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1018]">
          <div className="grid grid-cols-[1.4fr_1.3fr_1fr_70px_90px_100px_60px] border-b border-white/10 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-white/30">
            <span>Patient</span>
            <span>Study</span>
            <span>Date</span>
            <span>Modality</span>
            <span>Images</span>
            <span>Status</span>
            <span />
          </div>

          {studies.map((study) => (
            <div
              key={study.id}
              className="group grid grid-cols-[1.4fr_1.3fr_1fr_70px_90px_100px_60px] items-center border-b border-white/[0.06] px-5 py-4 transition hover:bg-white/[0.025] last:border-b-0"
            >
              <div>
                <div className="text-sm font-medium text-white">
                  {study.patient}
                </div>

                <div className="mt-0.5 text-xs text-white/35">
                  {study.mrn} · {study.id}
                </div>
              </div>

              <div>
                <div className="text-sm text-white/75">
                  {study.description}
                </div>

                <div className="mt-0.5 text-xs text-white/35">
                  {study.series}{" "}
                  {study.series === 1 ? "series" : "series"}
                </div>
              </div>

              <span className="text-sm text-white/55">
                {study.date}
              </span>

              <span className="w-fit rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white/60">
                {study.modality}
              </span>

              <span className="text-sm text-white/55">
                {study.images}
              </span>

              <div>
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                    study.status === "Ready"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : study.status === "Analyzing"
                        ? "bg-[#7047ff]/15 text-[#9b7cff]"
                        : "bg-blue-400/10 text-blue-300"
                  }`}
                >
                  {study.status}
                </span>
              </div>

              <div className="flex items-center justify-end gap-1">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 opacity-0 transition hover:bg-white/5 hover:text-white group-hover:opacity-100"
                  title="More options"
                >
                  <MoreHorizontal size={17} />
                </button>

                <button
                  onClick={() => navigate("/workspace")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
                  title="Open workspace"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudiesPage;