export type ReportStatus = "Draft" | "Finalized";

export type Report = {
  id: string;
  patient: string;
  patientId: string;
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

export type ApiReport = {
  id: string;
  report_id: string;
  study_id: string;
  status: string;
  findings?: string | null;
  impression?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  study_description?: string | null;
  modality?: string | null;
  patient_id?: string | null;
  patient_name?: string | null;
  mrn?: string | null;
};

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export function mapReport(row: ApiReport): Report {
  return {
    id: row.report_id ?? row.id,
    patient: row.patient_name ?? "Unknown patient",
    patientId: row.patient_id ?? "",
    mrn: row.mrn ? `MRN ${row.mrn}` : "MRN unavailable",
    studyId: row.study_id,
    study: row.study_description ?? row.study_id ?? "Unknown study",
    modality: row.modality ?? "—",
    createdAt: formatDate(row.created_at),
    updatedAt: formatDate(row.updated_at),
    author: "Medic Demo",
    status: String(row.status).toUpperCase() === "FINALIZED" ? "Finalized" : "Draft",
    findings: row.findings ?? "",
    impression: row.impression ?? "",
  };
}

export async function fetchReports(): Promise<Report[]> {
  const response = await fetch("/api/v1/reports/");
  if (!response.ok) {
    throw new Error(`Failed to load reports (${response.status})`);
  }

  const data = await response.json();
  const rows: ApiReport[] = Array.isArray(data) ? data : data.value ?? [];
  return rows.map(mapReport);
}
