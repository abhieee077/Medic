import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Monitor,
  FileText,
  MessageSquare,
  Clock3,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Patients", icon: Users, path: "/patients" },
  { label: "Studies", icon: FolderOpen, path: "/studies" },
  { label: "Workspace", icon: Monitor, path: "/workspace" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "AI Chat", icon: MessageSquare, path: "/ai-chat" },
  { label: "Timeline", icon: Clock3, path: "/timeline" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

function Sidebar() {
  return (
    <aside className="flex h-screen w-[240px] flex-col border-r border-white/10 bg-[#0d1018] px-3 py-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7047ff] text-lg font-bold text-white">
          M
        </div>

        <div>
          <div className="text-[16px] font-semibold text-white">
            Medic
          </div>

          <div className="text-[11px] text-white/40">
            Medical Imaging AI
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `group flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${
                  isActive
                    ? "bg-[#7047ff]/20 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={19}
                    strokeWidth={1.8}
                    className={
                      isActive
                        ? "text-[#9b7cff]"
                        : "text-white/45 group-hover:text-white"
                    }
                  />

                  <span>{item.label}</span>

                  {isActive && (
                    <span className="ml-auto h-5 w-1 rounded-full bg-[#7047ff]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 pt-4">
        <div className="rounded-xl bg-white/[0.03] p-3">
          <div className="text-xs font-medium text-white/80">
            City Hospital
          </div>

          <div className="mt-1 text-[11px] text-white/40">
            Radiology Department
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;