import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Workspace from "../../pages/Workspace";

function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090b12] text-white">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="min-h-0 flex-1 overflow-hidden">
          <Workspace />
        </main>
      </div>
    </div>
  );
}

export default AppShell;