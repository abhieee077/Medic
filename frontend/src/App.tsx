import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import Workspace from "./pages/Workspace";

// One Workspace instance per study, so results that arrive after switching
// studies (AI analysis, chat replies, saves) can't land in the new study.
function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#090b12] px-6 text-center">
      <h1 className="text-base font-semibold text-white">Page not found</h1>
      <p className="mt-1 text-sm text-white/35">This address doesn't match any page in Medic.</p>
      <a
        href="/dashboard"
        className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

function WorkspaceRoute() {
  const { studyId } = useParams();
  return <Workspace key={studyId ?? "default"} />;
}

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
            element={<WorkspaceRoute />}
          />

          <Route
            path="/workspace/:studyId"
            element={<WorkspaceRoute />}
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

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;