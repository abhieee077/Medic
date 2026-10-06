import {
  Search,
  UserPlus,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";

const patients = [
  {
    id: "PT-00124",
    name: "John Doe",
    age: 45,
    gender: "Male",
    mrn: "MRN 987654",
    lastStudy: "Apr 20, 2025",
    studies: 4,
    status: "Active",
  },
  {
    id: "PT-00125",
    name: "Emily Carter",
    age: 38,
    gender: "Female",
    mrn: "MRN 987655",
    lastStudy: "Apr 18, 2025",
    studies: 2,
    status: "Active",
  },
  {
    id: "PT-00126",
    name: "Michael Wilson",
    age: 62,
    gender: "Male",
    mrn: "MRN 987656",
    lastStudy: "Apr 15, 2025",
    studies: 7,
    status: "Active",
  },
  {
    id: "PT-00127",
    name: "Sophia Martinez",
    age: 29,
    gender: "Female",
    mrn: "MRN 987657",
    lastStudy: "Apr 11, 2025",
    studies: 1,
    status: "Active",
  },
];

function PatientsPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Patients</h1>
          <p className="mt-1 text-sm text-white/40">
            Manage patients and access their imaging history.
          </p>
        </div>

        <button className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]">
          <UserPlus size={17} />
          Add Patient
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {/* Search / filters */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3">
            <Search size={17} className="text-white/35" />
            <input
              type="text"
              placeholder="Search by name, MRN, or patient ID..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>

          <div className="text-sm text-white/35">
            {patients.length} patients
          </div>
        </div>

        {/* Patient table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1018]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_80px] border-b border-white/10 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-white/30">
            <span>Patient</span>
            <span>MRN</span>
            <span>Last Study</span>
            <span>Studies</span>
            <span />
          </div>

          {patients.map((patient) => (
            <div
              key={patient.id}
              className="group grid grid-cols-[1.5fr_1fr_1fr_1fr_80px] items-center border-b border-white/[0.06] px-5 py-4 transition hover:bg-white/[0.025] last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7047ff]/15 text-sm font-semibold text-[#9b7cff]">
                  {patient.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>

                <div>
                  <div className="text-sm font-medium text-white">
                    {patient.name}
                  </div>
                  <div className="mt-0.5 text-xs text-white/35">
                    {patient.id} · {patient.age}Y · {patient.gender}
                  </div>
                </div>
              </div>

              <span className="text-sm text-white/60">{patient.mrn}</span>

              <span className="text-sm text-white/60">
                {patient.lastStudy}
              </span>

              <div>
                <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs text-white/60">
                  {patient.studies}{" "}
                  {patient.studies === 1 ? "study" : "studies"}
                </span>
              </div>

              <div className="flex items-center justify-end gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 opacity-0 transition hover:bg-white/5 hover:text-white group-hover:opacity-100">
                  <MoreHorizontal size={17} />
                </button>

                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white">
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

export default PatientsPage;