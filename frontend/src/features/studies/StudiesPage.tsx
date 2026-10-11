import {
  Search,
  Upload,
  MoreHorizontal,
  ChevronRight,
  Filter,
  X,
  RefreshCw,
  Database,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type ApiStudy = {
  id: string;
  study_id: string;
  study_instance_uid: string | null;
  study_description: string | null;
  modality: string | null;
  study_date: string | null;
  study_time: string | null;
  status: string | null;
  accession_number: string | null;
  series_count?: number;
  instance_count?: number;
  patient: {
    id: string;
    patient_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
  } | null;
};

type StudiesResponse = {
  items: ApiStudy[];
  total: number;
};

type Patient = {
  id: string;
  patient_id: string;
  full_name: string;
  mrn?: string | null;
};

type PatientsResponse = {
  items: Patient[];
  total: number;
};

type Study = {
  id: string;
  patient: string;
  patientId: string;
  date: string;
  description: string;
  modality: string;
  status: string;
  accessionNumber: string;
  seriesCount: number;
  imageCount: number;
};

type OrthancStudy = {
  orthanc_study_id: string;
  study_instance_uid: string;
  study_description: string;
  modalities: string[];
  series_count: number;
  instance_count: number;
};

type ImportPreview = {
  mode: string;
  database_writes: boolean;
  orthanc_study_count: number;
  matched_count: number;
  unmatched_count: number;
  matched: OrthancStudy[];
  unmatched: OrthancStudy[];
};

const modalityOptions = ["All", "MR", "CT", "CR", "DX", "US"];
const statusOptions = ["All", "Ready", "Analyzing", "Reported"];

function formatStudyDate(value: string | null): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function normalizeStatus(value: string | null): string {
  switch ((value ?? "").toUpperCase()) {
    case "READY":
      return "Ready";
    case "ANALYZING":
      return "Analyzing";
    case "REPORTED":
      return "Reported";
    default:
      return value
        ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
        : "Unknown";
  }
}

function mapApiStudy(item: ApiStudy): Study {
  return {
    id: item.study_id,
    patient: item.patient?.full_name ?? "Unassigned patient",
    patientId: item.patient?.patient_id ?? "",
    date: formatStudyDate(item.study_date),
    description: item.study_description?.trim() || "Untitled study",
    modality: item.modality?.toUpperCase() || "Unknown",
    status: normalizeStatus(item.status),
    accessionNumber: item.accession_number ?? "",
    seriesCount: item.series_count ?? 0,
    imageCount: item.instance_count ?? 0,
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string | { msg?: string }[];
      message?: string;
    };

    if (typeof data.detail === "string") return data.detail;

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => item.msg ?? "Invalid request")
        .join("; ");
    }

    return data.message || `Request failed (HTTP ${response.status}).`;
  } catch {
    return `Request failed (HTTP ${response.status}).`;
  }
}

function StudiesPage() {
  const navigate = useNavigate();

  const [studies, setStudies] = useState<Study[]>([]);
  const [totalStudies, setTotalStudies] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [selectedStudy, setSelectedStudy] = useState<OrthancStudy | null>(
    null,
  );
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");

  const loadStudies = useCallback(async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const response = await fetch("/api/v1/studies/");

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = (await response.json()) as StudiesResponse;

      if (!Array.isArray(data.items)) {
        throw new Error("The studies API returned an unexpected response.");
      }

      setStudies(data.items.map(mapApiStudy));
      setTotalStudies(
        typeof data.total === "number" ? data.total : data.items.length,
      );
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Could not load studies.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadImportPreview = useCallback(async () => {
    setIsPreviewLoading(true);
    setPreviewError("");
    setImportError("");
    setImportMessage("");
    setSelectedStudy(null);
    setSelectedPatientId("");

    try {
      const [previewResponse, patientsResponse] = await Promise.all([
        fetch("/api/v1/dicom-import/review"),
        fetch("/api/v1/patients/"),
      ]);

      if (!previewResponse.ok) {
        throw new Error(await readError(previewResponse));
      }

      if (!patientsResponse.ok) {
        throw new Error(await readError(patientsResponse));
      }

      const previewData = (await previewResponse.json()) as ImportPreview;
      const patientData = (await patientsResponse.json()) as PatientsResponse;

      if (
        !Array.isArray(previewData.unmatched) ||
        !Array.isArray(previewData.matched) ||
        !Array.isArray(patientData.items)
      ) {
        throw new Error("An API returned an unexpected response format.");
      }

      setPreview(previewData);
      setPatients(patientData.items);
    } catch (error) {
      setPreviewError(
        error instanceof Error
          ? error.message
          : "Could not retrieve the Orthanc preview.",
      );
    } finally {
      setIsPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudies();
  }, [loadStudies]);

  const openImportDialog = () => {
    setIsImportOpen(true);
    void loadImportPreview();
  };

  const closeImportDialog = () => {
    if (isImporting) return;

    setIsImportOpen(false);
    setSelectedStudy(null);
    setSelectedPatientId("");
    setPreviewError("");
    setImportError("");
    setImportMessage("");
  };

  const confirmImport = async () => {
    if (!selectedStudy) {
      setImportError("Select a study to import.");
      return;
    }

    if (!selectedPatientId) {
      setImportError("Select the patient who owns this study.");
      return;
    }

    setIsImporting(true);
    setImportError("");
    setImportMessage("");

    try {
      const response = await fetch("/api/v1/dicom-import/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orthanc_study_id: selectedStudy.orthanc_study_id,
          patient_id: selectedPatientId,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const result = (await response.json()) as {
        message?: string;
        study_id?: string;
        detail?: string;
      };

      setImportMessage(
        result.message || "The study was imported successfully.",
      );
      setSelectedStudy(null);
      setSelectedPatientId("");

      await Promise.all([loadStudies(), loadImportPreview()]);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "The import failed.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const filteredStudies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return studies.filter((study) => {
      const searchableValues = [
        study.patient,
        study.patientId,
        study.id,
        study.description,
        study.modality,
        study.accessionNumber,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          value.toLowerCase().includes(query),
        );

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
          onClick={openImportDialog}
          className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]"
        >
          <Upload size={17} />
          Import from Orthanc
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
                placeholder="Search patient, study ID, accession..."
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

            <button
              onClick={() => void loadStudies()}
              disabled={isLoading}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white/55 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              title="Refresh studies"
            >
              <RefreshCw
                size={15}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="text-sm text-white/35">
            {filteredStudies.length} shown · {totalStudies} total
          </div>
        </div>

        {showFilters && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1018] px-4 py-3">
            <span className="text-xs font-medium text-white/35">
              Modality
            </span>

            <div className="flex flex-wrap items-center gap-1">
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

            <span className="text-xs font-medium text-white/35">Status</span>

            <div className="flex flex-wrap items-center gap-1">
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

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-white/45">
              <RefreshCw size={17} className="animate-spin" />
              Loading studies from the database...
            </div>
          ) : pageError ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
              <p className="text-sm font-medium text-red-300">
                Could not load studies
              </p>
              <p className="mt-2 max-w-lg text-xs text-white/45">
                {pageError}
              </p>
              <button
                onClick={() => void loadStudies()}
                className="mt-4 rounded-xl bg-[#7047ff] px-4 py-2 text-sm text-white transition hover:bg-[#805cff]"
              >
                Try again
              </button>
            </div>
          ) : filteredStudies.length > 0 ? (
            filteredStudies.map((study) => (
              <div
                key={study.id}
                className="group grid grid-cols-[1.4fr_1.3fr_1fr_70px_90px_100px_60px] items-center border-b border-white/[0.06] px-5 py-4 transition hover:bg-white/[0.025] last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    {study.patient}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-white/35">
                    {study.patientId || "No patient ID"} · {study.id}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm text-white/75">
                    {study.description}
                  </div>
                  <div className="mt-0.5 text-xs text-white/35">
                    {study.seriesCount > 0
                      ? `${study.seriesCount} series`
                      : "No images imported"}
                    {study.accessionNumber ? ` · Accession: ${study.accessionNumber}` : ""}
                  </div>
                </div>

                <span className="text-sm text-white/55">{study.date}</span>

                <span className="w-fit rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white/60">
                  {study.modality}
                </span>

                <span className="text-sm text-white/55">
                  {study.imageCount > 0 ? study.imageCount : "—"}
                </span>

                <div>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                      study.status === "Ready"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : study.status === "Analyzing"
                          ? "bg-[#7047ff]/15 text-[#9b7cff]"
                          : study.status === "Reported"
                            ? "bg-blue-400/10 text-blue-300"
                            : "bg-white/5 text-white/50"
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
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-xs text-[#b19cff] hover:text-white"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-white/30">
          Study records are loaded from PostgreSQL. Series and image counts
          come from studies imported from Orthanc.
        </p>
      </div>

      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1018] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Import from Orthanc
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  Review available DICOM studies and explicitly assign a
                  patient before importing.
                </p>
              </div>

              <button
                onClick={closeImportDialog}
                disabled={isImporting}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-xs text-white/40">Orthanc studies</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {preview?.orthanc_study_count ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-xs text-white/40">
                      Already matched
                    </p>
                    <p className="mt-1 text-xl font-semibold text-emerald-300">
                      {preview?.matched_count ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-xs text-white/40">
                      Needs patient assignment
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[#b19cff]">
                      {preview?.unmatched_count ?? "—"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => void loadImportPreview()}
                  disabled={isPreviewLoading || isImporting}
                  className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                >
                  <RefreshCw
                    size={14}
                    className={isPreviewLoading ? "animate-spin" : ""}
                  />
                  Refresh preview
                </button>
              </div>

              {preview?.database_writes === false && (
                <div className="flex items-start gap-2 rounded-xl border border-blue-400/20 bg-blue-400/5 p-3 text-xs text-blue-200">
                  <Database size={16} className="mt-0.5 shrink-0" />
                  Preview mode is read-only. No records are written until you
                  select a patient and confirm an import.
                </div>
              )}

              {previewError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Could not load preview</p>
                    <p className="mt-1 break-words text-xs">{previewError}</p>
                  </div>
                </div>
              )}

              {importError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <p className="break-words">{importError}</p>
                </div>
              )}

              {importMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                  <p className="break-words">{importMessage}</p>
                </div>
              )}

              {isPreviewLoading ? (
                <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-white/45">
                  <RefreshCw size={17} className="animate-spin" />
                  Retrieving studies from Orthanc...
                </div>
              ) : preview ? (
                preview.unmatched.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-white/80">
                      Available studies
                    </h3>

                    {preview.unmatched.map((study) => {
                      const isSelected =
                        selectedStudy?.orthanc_study_id ===
                        study.orthanc_study_id;

                      return (
                        <button
                          key={study.orthanc_study_id}
                          onClick={() => {
                            setSelectedStudy(study);
                            setSelectedPatientId("");
                            setImportError("");
                          }}
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            isSelected
                              ? "border-[#7047ff]/60 bg-[#7047ff]/10"
                              : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-medium text-white">
                                {study.study_description || "Untitled study"}
                              </p>
                              <p className="mt-1 break-all text-xs text-white/35">
                                Study UID: {study.study_instance_uid}
                              </p>
                            </div>
                            <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs text-white/60">
                              {study.modalities?.join(", ") || "Unknown"}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/50">
                            <span>{study.series_count} series</span>
                            <span>{study.instance_count} images</span>
                            <span>
                              {isSelected ? "Selected" : "Select study"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-40 flex-col items-center justify-center text-center">
                    <CheckCircle2
                      size={25}
                      className="mb-3 text-emerald-300"
                    />
                    <p className="text-sm font-medium text-white/80">
                      No unmatched studies
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      There are no studies waiting for patient assignment.
                    </p>
                  </div>
                )
              ) : null}

              {selectedStudy && (
                <div className="space-y-3 rounded-xl border border-[#7047ff]/30 bg-[#7047ff]/[0.05] p-4">
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Assign a patient
                    </h3>
                    <p className="mt-1 text-xs text-white/45">
                      Selected: {selectedStudy.study_description || "Untitled study"}
                    </p>
                  </div>

                  <label
                    htmlFor="orthanc-patient"
                    className="block text-xs font-medium text-white/60"
                  >
                    Patient from PostgreSQL
                  </label>

                  <select
                    id="orthanc-patient"
                    value={selectedPatientId}
                    onChange={(event) =>
                      setSelectedPatientId(event.target.value)
                    }
                    disabled={isImporting}
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#11141d] px-3 text-sm text-white outline-none focus:border-[#7047ff]/60"
                  >
                    <option value="">Select the correct patient...</option>
                    {patients.map((patient) => (
                      <option
                        key={patient.patient_id}
                        value={patient.patient_id}
                      >
                        {patient.full_name} ({patient.patient_id})
                      </option>
                    ))}
                  </select>

                  <p className="text-xs leading-5 text-amber-200/80">
                    Only select a patient after verifying the association.
                    The application will not infer a patient from the study
                    description.
                  </p>

                  <button
                    onClick={() => void confirmImport()}
                    disabled={!selectedPatientId || isImporting}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        Importing study...
                      </>
                    ) : (
                      <>
                        <Database size={15} />
                        Confirm import
                      </>
                    )}
                  </button>
                </div>
              )}

              {preview?.matched?.length ? (
                <details className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <summary className="cursor-pointer text-xs font-medium text-white/60">
                    View {preview.matched.length} already-matched studies
                  </summary>
                  <div className="mt-3 space-y-2">
                    {preview.matched.map((study) => (
                      <div
                        key={study.orthanc_study_id}
                        className="rounded-lg border border-white/[0.06] px-3 py-2"
                      >
                        <p className="text-xs text-white/70">
                          {study.study_description || "Untitled study"}
                        </p>
                        <p className="mt-1 text-xs text-white/35">
                          {study.modalities?.join(", ") || "Unknown"} ·{" "}
                          {study.instance_count} images
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>

            <div className="flex justify-end border-t border-white/10 px-5 py-4">
              <button
                onClick={closeImportDialog}
                disabled={isImporting}
                className="h-9 rounded-xl border border-white/10 px-4 text-sm text-white/55 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudiesPage;