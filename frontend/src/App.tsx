import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import Workspace from "./pages/Workspace";
import PatientsPage from "./features/patients/PatientsPage";

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/workspace" replace />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/patients" element={<PatientsPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;