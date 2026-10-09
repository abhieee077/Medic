import {
  ArrowLeft,
  Check,
  ExternalLink,
  FileText,
  Lock,
  Save,
  Unlock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

const mockReports: Report[] = [
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

function ReportDetailPage() {
  const navigate = useNavigate();
  const { reportId } = useParams();

  const initialReport = useMemo(
    () => mockReports.find((report) => report.id === reportId),
    [reportId],
  );

  const [report, setReport] = useState<Report | null>(
    initialReport ?? null,
  );

  const [findings, setFindings] = useState(
    initialReport?.findings ?? "",
  );

  const [impression, setImpression] = useState(
    initialReport?.impression ?? "",
  );

  const [saved, setSaved] = useState(false);

  if (!report) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#090b12] px-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white/30">
          <FileText size={21} />
        </div>

        <h1 className="text-base font-semibold text-white">
          Report not found
        </h1>

        <p className="mt-1 max-w-sm text-sm text-white/35">
          The requested report does not exist in the current workspace.
        </p>

        <button
          onClick={() => navigate("/reports")}
          className="mt-5 flex h-9 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to Reports
        </button>
      </div>
    );
  }

  const isFinalized = report.status === "Finalized";

  const saveDraft = () => {
    setReport((current) =>
      current
        ? {
            ...current,
            findings,
            impression,
            updatedAt: "Just now",
          }
        : current,
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  const toggleFinalize = () => {
    setReport((current) =>
      current
        ? {
            ...current,
            findings,
            impression,
            status:
              current.status === "Finalized" ? "Draft" : "Finalized",
            updatedAt: "Just now",
          }
        : current,
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate("/reports")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/5 hover:text-white"
            title="Back to Reports"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold text-white">
                {report.id}
              </h1>

              <span
                className={`rounded-lg px-2 py-1 text-[11px] font-medium ${
                  isFinalized
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-amber-400/10 text-amber-300"
                }`}
              >
                {report.status}
              </span>
            </div>

            <p className="mt-0.5 truncate text-xs text-white/35">
              {report.patient} · {report.study}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/workspace/${report.studyId}`)}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/55 transition hover:bg-white/5 hover:text-white"
          >
            <ExternalLink size={14} />
            Workspace
          </button>

          <button
            onClick={saveDraft}
            disabled={isFinalized}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/55 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? "Saved" : "Save Draft"}
          </button>

          <button
            onClick={toggleFinalize}
            className={`flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium transition ${
              isFinalized
                ? "border border-white/10 text-white/55 hover:bg-white/5 hover:text-white"
                : "bg-[#7047ff] text-white hover:bg-[#805cff]"
            }`}
          >
            {isFinalized ? (
              <>
                <Unlock size={14} />
                Reopen Draft
              </>
            ) : (
              <>
                <Lock size={14} />
                Finalize Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_280px] gap-6 p-6">
          {/* Editor */}
          <div className="space-y-5">
            {/* Findings */}
            <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">
                  Clinical Findings
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Document the relevant imaging observations.
                </p>
              </div>

              <div className="p-5">
                <textarea
                  value={findings}
                  onChange={(event) => setFindings(event.target.value)}
                  disabled={isFinalized}
                  placeholder="Enter clinical findings..."
                  className="min-h-64 w-full resize-y rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/50 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </section>

            {/* Impression */}
            <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">
                  Impression
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Summarize the key diagnostic conclusion.
                </p>
              </div>

              <div className="p-5">
                <textarea
                  value={impression}
                  onChange={(event) => setImpression(event.target.value)}
                  disabled={isFinalized}
                  placeholder="Enter report impression..."
                  className="min-h-40 w-full resize-y rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/50 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </section>
          </div>

          {/* Report metadata */}
          <aside className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
              <div className="border-b border-white/10 px-4 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  Report Details
                </h2>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {/* Patient */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Patient
                  </div>

                  <div className="mt-1 text-sm text-white/75">
                    {report.patient}
                  </div>

                  <div className="mt-0.5 text-xs text-white/35">
                    {report.mrn}
                  </div>
                </div>

                {/* Study */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Study
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/studies/${report.studyId}`)
                    }
                    className="mt-1 text-left text-sm text-[#a990ff] transition hover:text-[#c0b2ff]"
                  >
                    {report.study}
                  </button>

                  <div className="mt-0.5 text-xs text-white/35">
                    {report.studyId} · {report.modality}
                  </div>
                </div>

                {/* Author */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Author
                  </div>

                  <div className="mt-1 text-sm text-white/75">
                    {report.author}
                  </div>
                </div>

                {/* Created */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Created
                  </div>

                  <div className="mt-1 text-sm text-white/60">
                    {report.createdAt}
                  </div>
                </div>

                {/* Last Updated */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Last Updated
                  </div>

                  <div className="mt-1 text-sm text-white/60">
                    {report.updatedAt}
                  </div>
                </div>

                {/* Status */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-white/30">
                    Status
                  </div>

                  <div className="mt-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                        isFinalized
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-amber-400/10 text-amber-300"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Related study */}
            <button
              onClick={() => navigate(`/studies/${report.studyId}`)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#0d1018] px-4 py-3 text-left transition hover:bg-white/[0.035]"
            >
              <div>
                <div className="text-xs text-white/30">
                  Related Study
                </div>

                <div className="mt-1 text-sm text-white/70">
                  {report.studyId}
                </div>
              </div>

              <ExternalLink
                size={15}
                className="text-white/30"
              />
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ReportDetailPage;