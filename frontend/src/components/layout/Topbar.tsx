import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Upload,
  Bell,
  HelpCircle,
  ChevronDown,
  FileText,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  X,
  Keyboard,
  Mail,
  Send,
} from "lucide-react";

type SearchResult = {
  type: "Patient" | "Study" | "Report";
  title: string;
  subtitle: string;
  path: string;
  icon: typeof Users;
};

const searchResults: SearchResult[] = [
  {
    type: "Patient",
    title: "John Doe",
    subtitle: "MRN 987654",
    path: "/patients/PT-00124",
    icon: Users,
  },
  {
    type: "Patient",
    title: "Emily Carter",
    subtitle: "MRN 987655",
    path: "/patients/PT-00125",
    icon: Users,
  },
  {
    type: "Study",
    title: "MRI Brain w/ Contrast",
    subtitle: "ST-00192 · John Doe",
    path: "/workspace/ST-00192",
    icon: FolderOpen,
  },
  {
    type: "Study",
    title: "CT Chest",
    subtitle: "ST-00191 · Emily Carter",
    path: "/workspace/ST-00191",
    icon: FolderOpen,
  },
  {
    type: "Report",
    title: "MRI Brain Report",
    subtitle: "RP-00124 · John Doe",
    path: "/reports/RP-00124",
    icon: FileText,
  },
];

function Topbar() {
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSent, setSupportSent] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const filteredResults = searchResults.filter((result) => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return true;
    }

    return (
      result.title.toLowerCase().includes(query) ||
      result.subtitle.toLowerCase().includes(query) ||
      result.type.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function closeMenus() {
    setNotificationsOpen(false);
    setHelpOpen(false);
    setProfileOpen(false);
  }

  function openSearch() {
    closeMenus();
    setSearchOpen(true);
  }

  function handleSearchResult(path: string) {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(path);
  }

  return (
    <header className="relative flex h-[72px] items-center justify-between border-b border-white/10 bg-[#090b12] px-6">
      {/* Search */}
      <div ref={searchRef} className="relative">
        <div
          className={`flex h-10 items-center gap-3 rounded-xl border bg-white/[0.03] px-3 transition ${
            searchOpen
              ? "w-[460px] border-[#7047ff]/50"
              : "w-[420px] border-white/10"
          }`}
        >
          <Search size={18} className="shrink-0 text-white/35" />

          <input
            value={searchQuery}
            onFocus={openSearch}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchOpen(true);
            }}
            placeholder="Search patient, study, report..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />

          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="text-white/35 transition hover:text-white"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          ) : (
            <kbd className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/35">
              ⌘ K
            </kbd>
          )}
        </div>

        {searchOpen && (
          <div className="absolute left-0 top-12 z-50 w-[460px] overflow-hidden rounded-xl border border-white/10 bg-[#11141d] shadow-2xl shadow-black/40">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
                {searchQuery ? "Search Results" : "Quick Search"}
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-2">
              {filteredResults.length > 0 ? (
                filteredResults.map((result) => {
                  const Icon = result.icon;

                  return (
                    <button
                      key={`${result.type}-${result.title}`}
                      onClick={() => handleSearchResult(result.path)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7047ff]/10 text-[#9d82ff]">
                        <Icon size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white">
                          {result.title}
                        </div>

                        <div className="mt-0.5 text-xs text-white/40">
                          {result.subtitle}
                        </div>
                      </div>

                      <span className="text-[10px] text-white/30">
                        {result.type}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center">
                  <Search
                    size={22}
                    className="mx-auto mb-2 text-white/20"
                  />

                  <div className="text-sm text-white/55">
                    No results found
                  </div>

                  <div className="mt-1 text-xs text-white/30">
                    Try a patient name, MRN, study, or report.
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-4 py-2.5 text-[10px] text-white/30">
              Search across patients, studies, and reports
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Upload Study */}
        <button
          onClick={() => navigate("/studies")}
          className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-4 text-sm font-medium text-white transition hover:bg-[#805cff]"
        >
          <Upload size={17} />
          Upload Study
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen((value) => !value);
              setHelpOpen(false);
              setProfileOpen(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/55 transition hover:bg-white/5 hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={19} />

            <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7047ff] px-1 text-[9px] font-semibold text-white">
              3
            </span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-[330px] overflow-hidden rounded-xl border border-white/10 bg-[#11141d] shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Notifications
                  </div>

                  <div className="mt-0.5 text-[11px] text-white/35">
                    3 items need attention
                  </div>
                </div>

                <span className="rounded-full bg-[#7047ff]/15 px-2 py-1 text-[10px] font-medium text-[#a991ff]">
                  3 new
                </span>
              </div>

              <div className="p-2">
                <button
                  onClick={() => {
                    closeMenus();
                    navigate("/reports");
                  }}
                  className="flex w-full gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/5"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
                    <FileText size={15} />
                  </div>

                  <div>
                    <div className="text-sm text-white">
                      4 reports awaiting review
                    </div>

                    <div className="mt-1 text-[11px] text-white/35">
                      Review pending reports
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    closeMenus();
                    navigate("/studies");
                  }}
                  className="flex w-full gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/5"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7047ff]/10 text-[#9d82ff]">
                    <FolderOpen size={15} />
                  </div>

                  <div>
                    <div className="text-sm text-white">
                      6 studies pending analysis
                    </div>

                    <div className="mt-1 text-[11px] text-white/35">
                      Open studies
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    closeMenus();
                    navigate("/timeline");
                  }}
                  className="flex w-full gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/5"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300">
                    <Bell size={15} />
                  </div>

                  <div>
                    <div className="text-sm text-white">
                      3 follow-up studies
                    </div>

                    <div className="mt-1 text-[11px] text-white/35">
                      View timeline activity
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="relative">
          <button
            onClick={() => {
              setHelpOpen((value) => !value);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/55 transition hover:bg-white/5 hover:text-white"
            aria-label="Help"
          >
            <HelpCircle size={19} />
          </button>

          {helpOpen && (
            <div className="absolute right-0 top-12 z-50 w-[280px] overflow-hidden rounded-xl border border-white/10 bg-[#11141d] shadow-2xl shadow-black/40">
              <div className="border-b border-white/10 px-4 py-3">
                <div className="text-sm font-semibold text-white">
                  Help & Support
                </div>

                <div className="mt-1 text-[11px] text-white/35">
                  Quick guidance for MedSight
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => {
                    setHelpOpen(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/65 transition hover:bg-white/5 hover:text-white"
                >
                  <Settings size={16} />
                  Settings & preferences
                </button>

                <button
                  onClick={() => {
                    setHelpOpen(false);
                    setShortcutsOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/65 transition hover:bg-white/5 hover:text-white"
                >
                  <Keyboard size={16} />
                  Workspace shortcuts
                </button>

                <button
                  onClick={() => {
                    setHelpOpen(false);
                    setSupportSent(false);
                    setSupportOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/65 transition hover:bg-white/5 hover:text-white"
                >
                  <Mail size={16} />
                  Contact support
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-7 w-px bg-white/10" />

        {/* User */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((value) => !value);
              setNotificationsOpen(false);
              setHelpOpen(false);
            }}
            className="flex items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-white/5"
          >
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

            <ChevronDown
              size={16}
              className={`text-white/40 transition ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-[240px] overflow-hidden rounded-xl border border-white/10 bg-[#11141d] shadow-2xl shadow-black/40">
              <div className="border-b border-white/10 px-4 py-3">
                <div className="text-sm font-semibold text-white">
                  Dr. Sarah Johnson
                </div>

                <div className="mt-1 text-[11px] text-white/35">
                  Radiologist
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/65 transition hover:bg-white/5 hover:text-white"
                >
                  <Settings size={16} />
                  Settings
                </button>

                <button
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/65 transition hover:bg-white/5 hover:text-white"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workspace Shortcuts Modal */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#11141d] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-white">
                  Workspace Shortcuts
                </div>

                <div className="mt-1 text-xs text-white/35">
                  Quick controls for faster navigation
                </div>
              </div>

              <button
                onClick={() => setShortcutsOpen(false)}
                className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
                aria-label="Close shortcuts"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-2 p-4">
              {[
                ["⌘ K", "Open global search"],
                ["Esc", "Close menus and dialogs"],
                ["+", "Zoom in in Workspace"],
                ["−", "Zoom out in Workspace"],
                ["R", "Reset viewer"],
                ["← / →", "Previous / next image"],
                ["F", "Toggle fullscreen"],
              ].map(([shortcut, description]) => (
                <div
                  key={shortcut}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/[0.03]"
                >
                  <span className="text-sm text-white/60">
                    {description}
                  </span>

                  <kbd className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-white/60">
                    {shortcut}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Support Modal */}
      {supportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#11141d] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-white">
                  Contact Support
                </div>

                <div className="mt-1 text-xs text-white/35">
                  Tell us what you need help with
                </div>
              </div>

              <button
                onClick={() => setSupportOpen(false)}
                className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
                aria-label="Close support"
              >
                <X size={17} />
              </button>
            </div>

            {supportSent ? (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#7047ff]/15 text-[#a991ff]">
                  <Send size={20} />
                </div>

                <div className="mt-4 text-sm font-semibold text-white">
                  Request submitted
                </div>

                <div className="mt-2 text-xs leading-5 text-white/40">
                  Your support request has been recorded for this
                  frontend prototype.
                </div>

                <button
                  onClick={() => setSupportOpen(false)}
                  className="mt-5 rounded-xl bg-[#7047ff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#805cff]"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/50">
                    Your email
                  </label>

                  <input
                    type="email"
                    placeholder="doctor@hospital.com"
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-white/50">
                    How can we help?
                  </label>

                  <textarea
                    rows={4}
                    placeholder="Describe the issue or question..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7047ff]/50"
                  />
                </div>

                <button
                  onClick={() => setSupportSent(true)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#7047ff] text-sm font-medium text-white transition hover:bg-[#805cff]"
                >
                  <Send size={16} />
                  Send Request
                </button>

                <p className="text-center text-[10px] leading-4 text-white/25">
                  Support submission is currently simulated for the
                  frontend prototype.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Topbar;