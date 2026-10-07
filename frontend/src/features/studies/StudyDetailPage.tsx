import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  FileText,
  Image,
  UserRound,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const study = {
  id: "ST-00192",
  patient: "John Doe",
  mrn: "MRN 987654",
  date: "Apr 20, 2025",
  description: "MRI Brain w/ Contrast",
  modality: "MR",
  series: 4,
  images: 192,
  status: "Ready",
  accession: "MR20250420-001",
};

const series = [
  {
    name: "Axial T1",
    images: 48,
    description: "Pre-contrast axial T1-weighted sequence",
  },
  {
    name: "Axial T2",
    images: 52,
    description: "Axial T2-weighted sequence",
  },
  {
    name: "FLAIR",
    images: 44,
    description: "Fluid-attenuated inversion recovery",
  },
  {
    name: "Post-Contrast T1",
    images: 48,
    description: "Post-contrast axial T1-weighted sequence",
  },
];

function StudyDetailPage() {
  const navigate = useNavigate();
  const { studyId } = useParams();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      <div className="border-b border-white/10 px-6 py-5">
        <button
          onClick={() => navigate("/studies")}
          className="mb-4 flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Studies
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white/55">
                {study.modality}
              </span>

              <span className="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                {study.status}
              </span>
            </div>

            <h1 className="text-xl font-semibold text-white">
              {study.description}
            </h1>

            <p className="mt-1 text-sm text-white/40">
              {study.id} · {study.accession}
            </p>
          </div>

          <button
            onClick={() => navigate(`/workspace/${studyId}`)}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]"
          >
            <Image size={17} />
            Open Workspace
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/35">
              <UserRound size={14} />
              Patient
            </div>
            <div className="text-sm text-white/75">{study.patient}</div>
            <div className="mt-1 text-xs text-white/35">{study.mrn}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/35">
              <CalendarDays size={14} />
              Study Date
            </div>
            <div className="text-sm text-white/75">{study.date}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
            <div className="mb-2 text-xs text-white/35">Series</div>
            <div className="text-sm text-white/75">{study.series}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
            <div className="mb-2 text-xs text-white/35">Images</div>
            <div className="text-sm text-white/75">{study.images}</div>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-base font-semibold text-white">
            Series
          </h2>
          <p className="mt-1 text-sm text-white/35">
            Imaging series included in this study.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1018]">
          {series.map((item, index) => (
            <div
              key={item.name}
              className="group flex items-center justify-between border-b border-white/[0.06] px-5 py-4 transition hover:bg-white/[0.025] last:border-b-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7047ff]/10 text-sm font-medium text-[#9b7cff]">
                  {index + 1}
                </div>

                <div>
                  <div className="text-sm font-medium text-white/80">
                    {item.name}
                  </div>

                  <div className="mt-0.5 text-xs text-white/35">
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <span className="text-sm text-white/45">
                  {item.images} images
                </span>

                <button
                  onClick={() => navigate(`/workspace/${studyId}`)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
                  title="Open series"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">
              Report
            </h2>

            <p className="mt-1 text-sm text-white/35">
              Report associated with this study.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-white/50">
                <FileText size={17} />
              </div>

              <div>
                <div className="text-sm font-medium text-white/80">
                  MRI Brain w/ Contrast Report
                </div>

                <div className="mt-0.5 text-xs text-white/35">
                  Report data will be loaded from the backend.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudyDetailPage;