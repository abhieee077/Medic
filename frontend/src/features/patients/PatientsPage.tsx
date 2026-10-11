
import {
  Search,
  UserPlus,
  MoreHorizontal,
  ChevronRight,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

type ApiPatient = {
  id: string;
  patient_id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
};

type ApiStudy = {
  id: string;
  study_id: string;
  study_description: string | null;
  study_date: string | null;
  patient: {
    patient_id: string;
    full_name: string;
  };
};

type Patient = {
  id: string;
  name: string;
  age: number | null;
  gender: string;
  mrn: string;
  lastStudy: string;
  studies: number;
};

type PatientForm = {
  patient_id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
};

const API_BASE = "/api/v1";

const emptyForm: PatientForm = {
  patient_id: "",
  mrn: "",
  first_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  phone: "",
  email: "",
};

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const birthdayHasPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!birthdayHasPassed) age -= 1;

  return age >= 0 ? age : null;
}

function formatDate(date: string | null): string {
  if (!date) return "No studies";

  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Unknown";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "object" && item !== null && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return String(item);
        })
        .join(" ");
    }
  }

  return fallback;
}

function PatientsPage() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadPatients(signal?: AbortSignal) {
    setIsLoading(true);
    setError("");

    try {
      const [patientsResponse, studiesResponse] = await Promise.all([
        fetch(`${API_BASE}/patients/`, { signal }),
        fetch(`${API_BASE}/studies/`, { signal }),
      ]);

      if (!patientsResponse.ok) {
        throw new Error(`Patients request failed (${patientsResponse.status})`);
      }

      if (!studiesResponse.ok) {
        throw new Error(`Studies request failed (${studiesResponse.status})`);
      }

      const patientsData: { items: ApiPatient[]; total: number } =
        await patientsResponse.json();

      const studiesData: { items: ApiStudy[]; total: number } =
        await studiesResponse.json();

      const mappedPatients = patientsData.items.map((patient) => {
        const patientStudies = studiesData.items.filter(
          (study) => study.patient.patient_id === patient.patient_id,
        );

        const latestStudy = patientStudies
          .filter((study) => study.study_date)
          .sort((a, b) =>
            (b.study_date ?? "").localeCompare(a.study_date ?? ""),
          )[0];

        return {
          id: patient.patient_id,
          name:
            patient.full_name ||
            `${patient.first_name} ${patient.last_name}`.trim(),
          age: calculateAge(patient.date_of_birth),
          gender: patient.gender || "Not specified",
          mrn: patient.mrn ? `MRN ${patient.mrn}` : "No MRN",
          lastStudy: latestStudy
            ? formatDate(latestStudy.study_date)
            : patientStudies.length > 0
              ? "Date unavailable"
              : "No studies",
          studies: patientStudies.length,
        };
      });

      setPatients(mappedPatients);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load patients. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadPatients(controller.signal);
    return () => controller.abort();
  }, []);

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return patients;

    return patients.filter((patient) =>
      [patient.name, patient.mrn, patient.id].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [patients, searchQuery]);

  function updateField(field: keyof PatientForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError("");
    setFormSuccess("");
  }

  function closeAddModal() {
    if (isSaving) return;

    setIsAddModalOpen(false);
    setForm(emptyForm);
    setFormError("");
    setFormSuccess("");
  }

  async function handleAddPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    const payload = {
      patient_id: form.patient_id.trim(),
      mrn: form.mrn.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    };

    if (
      !payload.patient_id ||
      !payload.mrn ||
      !payload.first_name ||
      !payload.last_name
    ) {
      setFormError("Patient ID, MRN, first name, and last name are required.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE}/patients/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, `Could not create patient (${response.status}).`),
        );
      }

      setFormSuccess("Patient created successfully.");
      await loadPatients();

      setForm(emptyForm);
      setIsAddModalOpen(false);
      setFormSuccess("");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to create patient. Check the backend and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const fieldClass =
    "mt-1 w-full rounded-xl border border-white/10 bg-[#090b12] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]";
  const labelClass = "block text-xs font-medium text-white/60";

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
          onClick={() => {
            setForm(emptyForm);
            setFormError("");
            setFormSuccess("");
            setIsAddModalOpen(true);
          }}
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
            {isLoading ? "Loading..." : `${filteredPatients.length} patients`}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            <span>Could not load patient data: {error}</span>
            <button
              onClick={() => void loadPatients()}
              className="shrink-0 underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1018]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_80px] border-b border-white/10 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-white/30">
            <span>Patient</span>
            <span>MRN</span>
            <span>Last Study</span>
            <span>Studies</span>
            <span />
          </div>

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-white/45">
              Loading patients from the database...
            </div>
          ) : filteredPatients.length > 0 ? (
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
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {patient.name}
                    </div>
                    <div className="mt-0.5 text-xs text-white/35">
                      {patient.id} · {patient.age ?? "Age unknown"}Y ·{" "}
                      {patient.gender}
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
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 opacity-0 transition hover:bg-white/5 hover:text-white group-hover:opacity-100"
                    title="More options"
                    onClick={() => navigate(`/patients/${patient.id}`)}
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
                {error ? "Patient data unavailable" : "No patients found"}
              </p>
              <p className="mt-1 text-xs text-white/35">
                {error
                  ? "Check that the backend is running and try again."
                  : "Try searching with a different name, MRN, or patient ID."}
              </p>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-6 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1018] p-5 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Add Patient
              </h2>
              <button
                onClick={closeAddModal}
                disabled={isSaving}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>

            <p className="mb-5 text-sm leading-6 text-white/50">
              Enter the patient details to create a record in the database.
            </p>

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Patient ID *
                  <input
                    className={fieldClass}
                    value={form.patient_id}
                    onChange={(event) =>
                      updateField("patient_id", event.target.value)
                    }
                    placeholder="e.g. PT-00129"
                    maxLength={20}
                    required
                  />
                </label>

                <label className={labelClass}>
                  MRN *
                  <input
                    className={fieldClass}
                    value={form.mrn}
                    onChange={(event) => updateField("mrn", event.target.value)}
                    placeholder="Medical record number"
                    maxLength={100}
                    required
                  />
                </label>

                <label className={labelClass}>
                  First name *
                  <input
                    className={fieldClass}
                    value={form.first_name}
                    onChange={(event) =>
                      updateField("first_name", event.target.value)
                    }
                    placeholder="First name"
                    maxLength={100}
                    required
                  />
                </label>

                <label className={labelClass}>
                  Last name *
                  <input
                    className={fieldClass}
                    value={form.last_name}
                    onChange={(event) =>
                      updateField("last_name", event.target.value)
                    }
                    placeholder="Last name"
                    maxLength={100}
                    required
                  />
                </label>

                <label className={labelClass}>
                  Date of birth
                  <input
                    type="date"
                    className={fieldClass}
                    value={form.date_of_birth}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(event) =>
                      updateField("date_of_birth", event.target.value)
                    }
                  />
                </label>

                <label className={labelClass}>
                  Gender
                  <select
                    className={fieldClass}
                    value={form.gender}
                    onChange={(event) => updateField("gender", event.target.value)}
                  >
                    <option value="">Not specified</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </label>

                <label className={labelClass}>
                  Phone
                  <input
                    type="tel"
                    className={fieldClass}
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder="Phone number"
                    maxLength={30}
                  />
                </label>

                <label className={labelClass}>
                  Email
                  <input
                    type="email"
                    className={fieldClass}
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="name@example.com"
                    maxLength={255}
                  />
                </label>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2.5 text-sm text-red-300"
                >
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2.5 text-sm text-emerald-300"
                >
                  {formSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-white/[0.07] pt-4">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={isSaving}
                  className="h-10 rounded-xl border border-white/10 px-4 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientsPage;
