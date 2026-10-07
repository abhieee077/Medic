import {
  Search,
  UserPlus,
  MoreHorizontal,
  ChevronRight,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  lastStudy: string;
  studies: number;
  status: string;
};

const initialPatients: Patient[] = [
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
  const navigate = useNavigate();

  const [patients, setPatients] = useState(initialPatients);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    mrn: "",
  });

  const [formError, setFormError] = useState("");

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return patients;
    }

    return patients.filter((patient) =>
      [patient.name, patient.mrn, patient.id].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [patients, searchQuery]);

  const resetForm = () => {
    setForm({
      name: "",
      age: "",
      gender: "Male",
      mrn: "",
    });
    setFormError("");
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleAddPatient = () => {
    const name = form.name.trim();
    const age = Number(form.age);
    const mrn = form.mrn.trim();

    if (!name || !form.age || !mrn) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (age <= 0 || age > 120) {
      setFormError("Please enter a valid age.");
      return;
    }

    const newPatient: Patient = {
      id: `PT-${String(128 + patients.length).padStart(5, "0")}`,
      name,
      age,
      gender: form.gender,
      mrn,
      lastStudy: "No studies",
      studies: 0,
      status: "Active",
    };

    setPatients((current) => [newPatient, ...current]);
    closeModal();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#090b12]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Patients</h1>
          <p className="mt-1 text-sm text-white/40">
            Manage patients and access their imaging history.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]"
        >
          <UserPlus size={17} />
          Add Patient
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3">
            <Search size={17} className="text-white/35" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, MRN, or patient ID..."
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

          <div className="text-sm text-white/35">
            {filteredPatients.length}{" "}
            {filteredPatients.length === 1 ? "patient" : "patients"}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1018]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_80px] border-b border-white/10 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-white/30">
            <span>Patient</span>
            <span>MRN</span>
            <span>Last Study</span>
            <span>Studies</span>
            <span />
          </div>

          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
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

                <span className="text-sm text-white/60">
                  {patient.mrn}
                </span>

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
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 opacity-0 transition hover:bg-white/5 hover:text-white group-hover:opacity-100"
                    title="More options"
                  >
                    <MoreHorizontal size={17} />
                  </button>

                  <button
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
                    title="Open patient"
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
                No patients found
              </p>

              <p className="mt-1 text-xs text-white/35">
                Try searching with a different name, MRN, or patient ID.
              </p>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1018] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Add Patient
                </h2>
                <p className="mt-1 text-xs text-white/35">
                  Create a new patient record.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Full Name
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. John Doe"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Age
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={form.age}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        age: event.target.value,
                      }))
                    }
                    placeholder="45"
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Gender
                  </label>

                  <select
                    value={form.gender}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        gender: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#11141d] px-3 text-sm text-white outline-none focus:border-[#7047ff]/60"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  MRN
                </label>

                <input
                  value={form.mrn}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      mrn: event.target.value,
                    }))
                  }
                  placeholder="MRN 987658"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/60"
                />
              </div>

              {formError && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
              <button
                onClick={closeModal}
                className="h-9 rounded-xl border border-white/10 px-4 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleAddPatient}
                className="h-9 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]"
              >
                Add Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientsPage;