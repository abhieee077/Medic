import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import Workspace from "./pages/Workspace";

import DashboardPage from "./features/dashboard/DashboardPage";

import PatientsPage from "./features/patients/PatientsPage";
import PatientDetailPage from "./features/patients/PatientDetailPage";

import StudiesPage from "./features/studies/StudiesPage";
import StudyDetailPage from "./features/studies/StudyDetailPage";

import ReportsPage from "./features/reports/ReportsPage";
import ReportDetailPage from "./features/reports/ReportDetailPage";

import AIChatPage from "./features/ai-chat/AIChatPage";
import AIChatDetailPage from "./features/ai-chat/AIChatDetailPage";

import TimelinePage from "./features/timeline/TimelinePage";
import SettingsPage from "./features/settings/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Default */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          {/* Patients */}
          <Route
            path="/patients"
            element={<PatientsPage />}
          />

          <Route
            path="/patients/:patientId"
            element={<PatientDetailPage />}
          />

          {/* Studies */}
          <Route
            path="/studies"
            element={<StudiesPage />}
          />

          <Route
            path="/studies/:studyId"
            element={<StudyDetailPage />}
          />

          {/* Workspace */}
          <Route
            path="/workspace"
            element={<Workspace />}
          />

          <Route
            path="/workspace/:studyId"
            element={<Workspace />}
          />

          {/* Reports */}
          <Route
            path="/reports"
            element={<ReportsPage />}
          />

          <Route
            path="/reports/:reportId"
            element={<ReportDetailPage />}
          />

          {/* AI Chat */}
          <Route
            path="/ai-chat"
            element={<AIChatPage />}
          />

          <Route
            path="/ai-chat/:conversationId"
            element={<AIChatDetailPage />}
          />

          {/* Timeline */}
          <Route
            path="/timeline"
            element={<TimelinePage />}
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={<SettingsPage />}
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;