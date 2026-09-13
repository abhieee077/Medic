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

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Patients", icon: Users },
  { label: "Studies", icon: FolderOpen },
  { label: "Workspace", icon: Monitor, active: true },
  { label: "Reports", icon: FileText },
  { label: "AI Chat", icon: MessageSquare },
  { label: "Timeline", icon: Clock3 },
  { label: "Settings", icon: Settings },
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
            <button
              key={item.label}
              className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${
                item.active
                  ? "bg-[#7047ff]/20 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon
                size={19}
                strokeWidth={1.8}
                className={
                  item.active
                    ? "text-[#9b7cff]"
                    : "text-white/45 group-hover:text-white"
                }
              />

              <span>{item.label}</span>

              {item.active && (
                <span className="ml-auto h-5 w-1 rounded-full bg-[#7047ff]" />
              )}
            </button>
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