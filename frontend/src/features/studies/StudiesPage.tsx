import {
  Search,
  Upload,
  MoreHorizontal,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Study = {
  id: string;
  patient: string;
  mrn: string;
  date: string;
  description: string;
  modality: string;
  series: number;
  images: number;
  status: string;
};

const initialStudies: Study[] = [
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

const modalityOptions = ["All", "MR", "CT", "CR"];
const statusOptions = ["All", "Ready", "Analyzing", "Reported"];

function StudiesPage() {
  const navigate = useNavigate();

  const [studies, setStudies] = useState(initialStudies);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [uploadForm, setUploadForm] = useState({
    patient: "",
    description: "",
    modality: "MR",
  });

  const [uploadError, setUploadError] = useState("");

  const filteredStudies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return studies.filter((study) => {
      const matchesSearch =
        !query ||
        [
          study.patient,
          study.mrn,
          study.id,
          study.description,
          study.modality,
        ].some((value) => value.toLowerCase().includes(query));

      const matchesModality =
        modalityFilter === "All" || study.modality === modalityFilter;

      const matchesStatus =
        statusFilter === "All" || study.status === statusFilter;

      return matchesSearch && matchesModality && matchesStatus;
    });
  }, [studies, searchQuery, modalityFilter, statusFilter]);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    modalityFilter !== "All" ||
    statusFilter !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setModalityFilter("All");
    setStatusFilter("All");
  };

  const resetUploadForm = () => {
    setUploadForm({
      patient: "",
      description: "",
      modality: "MR",
    });
    setUploadError("");
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    resetUploadForm();
  };

  const handleUploadStudy = () => {
    const patient = uploadForm.patient.trim();
    const description = uploadForm.description.trim();

    if (!patient || !description) {
      setUploadError("Please fill in all required fields.");
      return;
    }

    const newStudy: Study = {
      id: `ST-${String(193 + studies.length).padStart(5, "0")}`,
      patient,
      mrn: "Pending MRN",
      date: "Today",
      description,
      modality: uploadForm.modality,
      series: 0,
      images: 0,
      status: "Analyzing",
    };

    setStudies((current) => [newStudy, ...current]);
    closeUploadModal();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Studies</h1>
          <p className="mt-1 text-sm text-white/40">
            Browse imaging studies and open them in the workspace.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]"
        >
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
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search patient, MRN, accession..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-white/30 transition hover:text-white"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters((current) => !current)}
              className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition ${
                showFilters || hasActiveFilters
                  ? "border-[#7047ff]/40 bg-[#7047ff]/10 text-[#b19cff]"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          <div className="text-sm text-white/35">
            {filteredStudies.length}{" "}
            {filteredStudies.length === 1 ? "study" : "studies"}
          </div>
        </div>

        {showFilters && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1018] px-4 py-3">
            <span className="text-xs font-medium text-white/35">
              Modality
            </span>

            <div className="flex items-center gap-1">
              {modalityOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setModalityFilter(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs transition ${
                    modalityFilter === option
                      ? "bg-[#7047ff]/15 text-[#b19cff]"
                      : "text-white/45 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="mx-2 h-5 w-px bg-white/10" />

            <span className="text-xs font-medium text-white/35">
              Status
            </span>

            <div className="flex items-center gap-1">
              {statusOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setStatusFilter(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs transition ${
                    statusFilter === option
                      ? "bg-[#7047ff]/15 text-[#b19cff]"
                      : "text-white/45 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1.5 text-xs text-white/35 transition hover:text-white"
              >
                <X size={13} />
                Clear
              </button>
            )}
          </div>
        )}

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

          {filteredStudies.length > 0 ? (
            filteredStudies.map((study) => (
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
                    {study.series} series
                  </div>
                </div>

                <span className="text-sm text-white/55">
                  {study.date}
                </span>

                <span className="w-fit rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white/60">
                  {study.modality}
                </span>

                <span className="text-sm text-white/55">
                  {study.images || "—"}
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

                <div className="relative flex items-center justify-end gap-1">
                  <button
                    onClick={() =>
                      setOpenMenuId((current) =>
                        current === study.id ? null : study.id,
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 opacity-0 transition hover:bg-white/5 hover:text-white group-hover:opacity-100"
                    title="More options"
                  >
                    <MoreHorizontal size={17} />
                  </button>

                  {openMenuId === study.id && (
                    <div className="absolute right-9 top-8 z-20 w-36 rounded-xl border border-white/10 bg-[#151923] p-1 shadow-xl">
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          navigate(`/workspace/${study.id}`);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
                      >
                        Open workspace
                      </button>

                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          navigate(`/studies/${study.id}`);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
                      >
                        View details
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/workspace/${study.id}`)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
                    title="Open workspace"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-white/30">
                <Search size={18} />
              </div>

              <p className="text-sm font-medium text-white/70">
                No studies found
              </p>

              <p className="mt-1 text-xs text-white/35">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1018] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Upload Study
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Start a new imaging study workflow.
                </p>
              </div>

              <button
                onClick={closeUploadModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Patient Name
                </label>

                <input
                  value={uploadForm.patient}
                  onChange={(event) =>
                    setUploadForm((current) => ({
                      ...current,
                      patient: event.target.value,
                    }))
                  }
                  placeholder="e.g. John Doe"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/60"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Study Description
                </label>

                <input
                  value={uploadForm.description}
                  onChange={(event) =>
                    setUploadForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="e.g. MRI Brain w/ Contrast"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/60"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Modality
                </label>

                <select
                  value={uploadForm.modality}
                  onChange={(event) =>
                    setUploadForm((current) => ({
                      ...current,
                      modality: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#11141d] px-3 text-sm text-white outline-none focus:border-[#7047ff]/60"
                >
                  <option>MR</option>
                  <option>CT</option>
                  <option>CR</option>
                </select>
              </div>

              <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center">
                <Upload size={22} className="mx-auto mb-2 text-white/30" />

                <p className="text-sm text-white/60">
                  Select DICOM files
                </p>

                <p className="mt-1 text-xs text-white/30">
                  DICOM files will be processed when backend ingestion is
                  connected.
                </p>

                <button
                  type="button"
                  className="mt-3 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/55 transition hover:bg-white/5 hover:text-white"
                >
                  Choose Files
                </button>
              </div>

              {uploadError && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
              <button
                onClick={closeUploadModal}
                className="h-9 rounded-xl border border-white/10 px-4 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleUploadStudy}
                className="h-9 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]"
              >
                Start Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudiesPage;