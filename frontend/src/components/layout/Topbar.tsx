import {
  Search,
  Upload,
  Bell,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

function Topbar() {
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-white/10 bg-[#090b12] px-6">
      
      {/* Search */}
      <div className="flex h-10 w-[420px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3">
        <Search size={18} className="text-white/35" />

        <span className="flex-1 text-sm text-white/35">
          Search patient, study, report...
        </span>

        <kbd className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/35">
          ⌘ K
        </kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        
        <button className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]">
          <Upload size={17} />
          Upload Study
        </button>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/55 hover:bg-white/5 hover:text-white">
          <Bell size={19} />

          <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7047ff] px-1 text-[9px] font-semibold text-white">
            3
          </span>
        </button>

        <button className="flex h-10 w-10 items-center justify-center rounded-xl text-white/55 hover:bg-white/5 hover:text-white">
          <HelpCircle size={19} />
        </button>

        <div className="h-7 w-px bg-white/10" />

        {/* User */}
        <button className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-white/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7047ff] text-sm font-semibold text-white">
            SJ
          </div>

          <div className="text-left">
            <div className="text-sm font-medium text-white">
              Dr. Sarah Johnson
            </div>

            <div className="text-[11px] text-white/40">
              Radiologist
            </div>
          </div>

          <ChevronDown size={16} className="text-white/40" />
        </button>
      </div>
    </header>
  );
}

export default Topbar;