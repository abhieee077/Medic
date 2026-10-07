import {
  Search,
  FileText,
  MoreHorizontal,
  ChevronRight,
  Filter,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type ReportStatus = "Draft" | "Finalized";

type Report = {
  id: string;
  patient: string;
  mrn: string;
  studyId: string;
  study: string;
  modality: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  status: ReportStatus;
  findings: string;
  impression: string;
};

const initialReports: Report[] = [
  {
    id: "RP-00124",
    patient: "John Doe",
    mrn: "MRN 987654",
    studyId: "ST-00192",
    study: "MRI Brain w/ Contrast",
    modality: "MR",
    createdAt: "Apr 20, 2025",
    updatedAt: "Apr 20, 2025",
    author: "Dr. Sarah Johnson",
    status: "Finalized",
    findings:
      "No acute intracranial hemorrhage or mass effect. Mild scattered T2/FLAIR hyperintense foci are present within the periventricular white matter.",
    impression:
      "No acute intracranial abnormality. Mild nonspecific chronic white matter changes.",
  },
  {
    id: "RP-00123",
    patient: "Emily Carter",
    mrn: "MRN 987655",
    studyId: "ST-00191",
    study: "CT Chest",
    modality: "CT",
    createdAt: "Apr 18, 2025",
    updatedAt: "Apr 18, 2025",
    author: "Dr. Sarah Johnson",
    status: "Finalized",
    findings:
      "No focal airspace consolidation, pleural effusion, or pneumothorax. Cardiomediastinal silhouette is within normal limits.",
    impression:
      "No acute cardiopulmonary abnormality.",
  },
  {
    id: "RP-00122",
    patient: "Michael Wilson",
    mrn: "MRN 987656",
    studyId: "ST-00190",
    study: "MRI Knee",
    modality: "MR",
    createdAt: "Apr 15, 2025",
    updatedAt: "Apr 15, 2025",
    author: "Dr. Sarah Johnson",
    status: "Draft",
    findings:
      "Evaluation demonstrates mild joint effusion. There is increased signal involving the medial meniscus.",
    impression:
      "Findings suspicious for medial meniscal injury. Recommend correlation with clinical examination.",
  },
  {
    id: "RP-00121",
    patient: "Sophia Martinez",
    mrn: "MRN 987657",
    studyId: "ST-00189",
    study: "CT Head",
    modality: "CT",
    createdAt: "Apr 11, 2025",
    updatedAt: "Apr 11, 2025",
    author: "Dr. Sarah Johnson",
    status: "Draft",
    findings:
      "No acute intracranial hemorrhage, midline shift, or mass effect. Ventricular system is within normal limits.",
    impression: "No acute intracranial abnormality.",
  },
];

const statusOptions = ["All", "Draft", "Finalized"];
const modalityOptions = ["All", "MR", "CT", "CR"];

function ReportsPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState(initialReports);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalityFilter, setModalityFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    patient: "",
    mrn: "",
    study: "",
    modality: "MR",
  });

  const [createError, setCreateError] = useState("");

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        !query ||
        [
          report.patient,
          report.mrn,
          report.id,
          report.studyId,
          report.study,
          report.modality,
          report.author,
        ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All" || report.status === statusFilter;

      const matchesModality =
        modalityFilter === "All" || report.modality === modalityFilter;

      return matchesSearch && matchesStatus && matchesModality;
    });
  }, [reports, searchQuery, statusFilter, modalityFilter]);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== "All" ||
    modalityFilter !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setModalityFilter("All");
  };

  const resetCreateForm = () => {
    setCreateForm({
      patient: "",
      mrn: "",
      study: "",
      modality: "MR",
    });
    setCreateError("");
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  const handleCreateReport = () => {
    const patient = createForm.patient.trim();
    const mrn = createForm.mrn.trim();
    const study = createForm.study.trim();

    if (!patient || !mrn || !study) {
      setCreateError("Please fill in all required fields.");
      return;
    }

    const reportNumber = 125 + reports.length;

    const newReport: Report = {
      id: `RP-${String(reportNumber).padStart(5, "0")}`,
      patient,
      mrn,
      studyId: `ST-${String(193 + reports.length).padStart(5, "0")}`,
      study,
      modality: createForm.modality,
      createdAt: "Today",
      updatedAt: "Today",
      author: "Dr. Sarah Johnson",
      status: "Draft",
      findings: "",
      impression: "",
    };

    setReports((current) => [newReport, ...current]);
    closeCreateModal();
  };

  const deleteReport = (reportId: string) => {
    setReports((current) =>
      current.filter((report) => report.id !== reportId),
    );
    setOpenMenuId(null);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Reports</h1>

          <p className="mt-1 text-sm text-white/40">
            Review, edit, and finalize imaging reports.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]"
        >
          <Plus size={17} />
          New Report
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
                placeholder="Search patient, MRN, report ID..."
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
            {filteredReports.length}{" "}
            {filteredReports.length === 1 ? "report" : "reports"}
          </div>
        </div>

        {showFilters && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1018] px-4 py-3">
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

            <div className="mx-2 h-5 w-px bg-white/10" />

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
          <div className="grid grid-cols-[1.35fr_1.45fr_1fr_80px_110px_90px_60px] border-b border-white/10 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-white/30">
            <span>Patient</span>
            <span>Study</span>
            <span>Updated</span>
            <span>Modality</span>
            <span>Author</span>
            <span>Status</span>
            <span />
          </div>

          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="group grid grid-cols-[1.35fr_1.45fr_1fr_80px_110px_90px_60px] items-center border-b border-white/[0.06] px-5 py-4 transition hover:bg-white/[0.025] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7047ff]/10 text-[#9b7cff]">
                    <FileText size={17} />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">
                      {report.patient}
                    </div>

                    <div className="mt-0.5 text-xs text-white/35">
                      {report.mrn} · {report.id}
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm text-white/75">
                    {report.study}
                  </div>

                  <div className="mt-0.5 text-xs text-white/35">
                    {report.studyId}
                  </div>
                </div>

                <span className="text-sm text-white/55">
                  {report.updatedAt}
                </span>

                <span className="w-fit rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white/60">
                  {report.modality}
                </span>

                <span className="truncate text-sm text-white/55">
                  {report.author.replace("Dr. ", "")}
                </span>

                <div>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                      report.status === "Finalized"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    {report.status}
                  </span>
                </div>

                <div className="relative flex items-center justify-end gap-1">
                  <button
                    onClick={() =>
                      setOpenMenuId((current) =>
                        current === report.id ? null : report.id,
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 opacity-0 transition hover:bg-white/5 hover:text-white group-hover:opacity-100"
                    title="More options"
                  >
                    <MoreHorizontal size={17} />
                  </button>

                  {openMenuId === report.id && (
                    <div className="absolute right-9 top-8 z-20 w-40 rounded-xl border border-white/10 bg-[#151923] p-1 shadow-xl">
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          navigate(`/reports/${report.id}`);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
                      >
                        Open report
                      </button>

                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          navigate(`/workspace/${report.studyId}`);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
                      >
                        Open workspace
                      </button>

                      <button
                        onClick={() => deleteReport(report.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-300 transition hover:bg-red-400/10"
                      >
                        <Trash2 size={13} />
                        Delete report
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
                    title="Open report"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-white/30">
                <FileText size={18} />
              </div>

              <p className="text-sm font-medium text-white/70">
                No reports found
              </p>

              <p className="mt-1 text-xs text-white/35">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1018] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  New Report
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Create a draft report for an imaging study.
                </p>
              </div>

              <button
                onClick={closeCreateModal}
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
                  value={createForm.patient}
                  onChange={(event) =>
                    setCreateForm((current) => ({
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
                  MRN
                </label>

                <input
                  value={createForm.mrn}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      mrn: event.target.value,
                    }))
                  }
                  placeholder="MRN 987654"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/60"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Study
                </label>

                <input
                  value={createForm.study}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      study: event.target.value,
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
                  value={createForm.modality}
                  onChange={(event) =>
                    setCreateForm((current) => ({
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

              {createError && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">
                  {createError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
              <button
                onClick={closeCreateModal}
                className="h-9 rounded-xl border border-white/10 px-4 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateReport}
                className="h-9 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]"
              >
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;