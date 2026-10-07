import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  FileText,
  Image,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const patient = {
  id: "PT-00124",
  name: "John Doe",
  age: 45,
  gender: "Male",
  mrn: "MRN 987654",
  dateOfBirth: "Aug 14, 1979",
  phone: "+1 (555) 014-2088",
  lastStudy: "Apr 20, 2025",
};

const studies = [
  {
    id: "ST-00192",
    date: "Apr 20, 2025",
    description: "MRI Brain w/ Contrast",
    modality: "MR",
    series: 4,
    images: 192,
    status: "Ready",
  },
  {
    id: "ST-00174",
    date: "Mar 08, 2025",
    description: "CT Head",
    modality: "CT",
    series: 2,
    images: 84,
    status: "Reported",
  },
  {
    id: "ST-00141",
    date: "Jan 22, 2025",
    description: "MRI Brain w/o Contrast",
    modality: "MR",
    series: 3,
    images: 156,
    status: "Reported",
  },
  {
    id: "ST-00098",
    date: "Nov 12, 2024",
    description: "X-Ray Chest",
    modality: "CR",
    series: 1,
    images: 2,
    status: "Reported",
  },
];

function PatientDetailPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5">
        <button
          onClick={() => navigate("/patients")}
          className="mb-4 flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Patients
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7047ff]/15 text-lg font-semibold text-[#9b7cff]">
              JD
            </div>

            <div>
              <h1 className="text-xl font-semibold text-white">
                {patient.name}
              </h1>

              <p className="mt-1 text-sm text-white/40">
                {patient.id} · {patient.mrn}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/workspace")}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]"
          >
            <Image size={17} />
            Open Latest Study
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        {/* Patient information */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/35">
              <UserRound size={14} />
              Demographics
            </div>

            <div className="text-sm text-white/75">
              {patient.age} years · {patient.gender}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
            <div className="mb-2 text-xs text-white/35">
              Date of Birth
            </div>

            <div className="text-sm text-white/75">
              {patient.dateOfBirth}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
            <div className="mb-2 text-xs text-white/35">
              Phone
            </div>

            <div className="text-sm text-white/75">
              {patient.phone}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/35">
              <CalendarDays size={14} />
              Last Study
            </div>

            <div className="text-sm text-white/75">
              {patient.lastStudy}
            </div>
          </div>
        </div>

        {/* Study history */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Study History
            </h2>

            <p className="mt-1 text-sm text-white/35">
              Imaging studies associated with this patient.
            </p>
          </div>

          <span className="text-sm text-white/35">
            {studies.length} studies
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1018]">
          <div className="grid grid-cols-[1.5fr_1.3fr_90px_90px_110px_60px] border-b border-white/10 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-white/30">
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
              className="group grid grid-cols-[1.5fr_1.3fr_90px_90px_110px_60px] items-center border-b border-white/[0.06] px-5 py-4 transition hover:bg-white/[0.025] last:border-b-0"
            >
              <div>
                <div className="text-sm font-medium text-white/85">
                  {study.description}
                </div>

                <div className="mt-0.5 text-xs text-white/35">
                  {study.id} · {study.series}{" "}
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
                      : "bg-blue-400/10 text-blue-300"
                  }`}
                >
                  {study.status}
                </span>
              </div>

              <button
                onClick={() => navigate("/workspace")}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
                title="Open study"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          ))}
        </div>

        {/* Reports */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">
              Recent Reports
            </h2>

            <p className="mt-1 text-sm text-white/35">
              Reports associated with this patient's imaging history.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1018]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-white/50">
                  <FileText size={17} />
                </div>

                <div>
                  <div className="text-sm font-medium text-white/80">
                    MRI Brain w/ Contrast Report
                  </div>

                  <div className="mt-0.5 text-xs text-white/35">
                    Apr 20, 2025 · Dr. Sarah Johnson
                  </div>
                </div>
              </div>

              <span className="rounded-lg bg-blue-400/10 px-2.5 py-1 text-xs font-medium text-blue-300">
                Final
              </span>
            </div>

            <div className="px-5 py-4 text-sm leading-6 text-white/45">
              Final radiology report is available for review.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDetailPage;