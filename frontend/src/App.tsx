import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import Workspace from "./pages/Workspace";

import DashboardPage from "./features/dashboard/DashboardPage";
import PatientsPage from "./features/patients/PatientsPage";
import PatientDetailPage from "./features/patients/PatientDetailPage";
import StudiesPage from "./features/studies/StudiesPage";
import StudyDetailPage from "./features/studies/StudyDetailPage";

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/workspace"
            element={<Workspace />}
          />

          <Route
            path="/workspace/:studyId"
            element={<Workspace />}
          />

          <Route
            path="/patients"
            element={<PatientsPage />}
          />

          <Route
            path="/patients/:patientId"
            element={<PatientDetailPage />}
          />

          <Route
            path="/studies"
            element={<StudiesPage />}
          />

          <Route
            path="/studies/:studyId"
            element={<StudyDetailPage />}
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;