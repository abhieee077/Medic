import {
  Search,
  FileText,
  MoreHorizontal,
  ChevronRight,
  Filter,
  X,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchReports, type Report } from "./reportApi";

type StudyOption = {
  studyId: string;
  label: string;
};

const statusOptions = ["All", "Draft", "Finalized"];
const modalityOptions = ["All", "MR", "CT", "CR"];

function ReportsPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      try {
        const mapped = await fetchReports();
        if (!cancelled) setReports(mapped);
      } catch (error) {
        console.error("Could not load reports:", error);
        if (!cancelled) {
          setLoadError("Could not load reports. Check that the backend is running.");
        }
      } finally {
        if (!cancelled) setLoadingReports(false);
      }
    }

    void loadReports();
    return () => {
      cancelled = true;
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalityFilter, setModalityFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [studyOptions, setStudyOptions] = useState<StudyOption[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [creating, setCreating] = useState(false);
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

  const openCreateModal = async () => {
    setIsCreateModalOpen(true);
    setCreateError("");

    try {
      const response = await fetch("/api/v1/studies/");
      if (!response.ok) throw new Error(`Failed to load studies (${response.status})`);

      const data = await response.json();
      const options: StudyOption[] = (data.items ?? []).map(
        (study: {
          study_id: string;
          study_description?: string | null;
          modality?: string | null;
          patient?: { full_name?: string };
        }) => ({
          studyId: study.study_id,
          label: `${study.patient?.full_name ?? "Unknown patient"} · ${
            study.study_description ?? study.study_id
          } (${study.study_id})`,
        }),
      );

      setStudyOptions(options);
      setSelectedStudyId((current) => current || options[0]?.studyId || "");
    } catch (error) {
      console.error("Could not load studies:", error);
      setCreateError("Could not load studies. Check that the backend is running.");
    }
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateError("");
  };

  const handleCreateReport = async () => {
    if (!selectedStudyId) {
      setCreateError("Please select a study.");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      // A study keeps one active draft. Open it rather than overwriting its text.
      const existing = await fetch(
        `/api/v1/reports/study/${encodeURIComponent(selectedStudyId)}`,
      );
      if (!existing.ok) throw new Error(`Failed to check drafts (${existing.status})`);

      const existingData = await existing.json();
      if (existingData.draft?.report_id) {
        navigate(`/reports/${existingData.draft.report_id}`);
        return;
      }

      const response = await fetch("/api/v1/reports/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study_id: selectedStudyId, findings: "", impression: "" }),
      });
      if (!response.ok) throw new Error(`Failed to create draft (${response.status})`);

      const created = await response.json();
      navigate(`/reports/${created.report_id}`);
    } catch (error) {
      console.error("Could not create report:", error);
      setCreateError("Could not create the draft. Check that the backend is running.");
    } finally {
      setCreating(false);
    }
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
          onClick={() => void openCreateModal()}
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

          {loadingReports ? (
            <div className="px-5 py-12 text-center text-sm text-white/50">
              Loading reports...
            </div>
          ) : filteredReports.length > 0 ? (
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
                {loadError ? "Reports unavailable" : "No reports found"}
              </p>

              <p className="mt-1 text-xs text-white/35">
                {loadError ||
                  (hasActiveFilters
                    ? "Try changing your search or filters."
                    : "Create a draft report from an imaging study to get started.")}
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
                  Study
                </label>

                <select
                  value={selectedStudyId}
                  onChange={(event) => setSelectedStudyId(event.target.value)}
                  disabled={studyOptions.length === 0}
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#11141d] px-3 text-sm text-white outline-none focus:border-[#7047ff]/60 disabled:opacity-50"
                >
                  {studyOptions.length === 0 && <option value="">Loading studies...</option>}
                  {studyOptions.map((option) => (
                    <option key={option.studyId} value={option.studyId}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <p className="mt-1.5 text-[11px] text-white/30">
                  If the study already has a draft, it will be opened instead.
                </p>
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
                onClick={() => void handleCreateReport()}
                disabled={creating || !selectedStudyId}
                className="h-9 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;