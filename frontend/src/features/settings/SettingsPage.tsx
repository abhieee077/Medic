import {
  Bell,
  Check,
  ChevronRight,
  Monitor,
  Moon,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { useState } from "react";

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition ${
        enabled ? "bg-[#7047ff]" : "bg-white/10"
      }`}
      aria-label="Toggle setting"
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    compactMode: false,
    aiSuggestions: true,
    notifications: true,
    reportNotifications: true,
    studyNotifications: true,
    emailNotifications: false,
    autoSave: true,
  });

  const update = (key: keyof typeof settings) => {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));

    setSaved(false);
  };

  const saveSettings = () => {
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#090b12]">
      <div className="mx-auto max-w-5xl px-6 py-6">
        <div>
          <h1 className="text-lg font-semibold text-white">
            Settings
          </h1>

          <p className="mt-1 text-sm text-white/35">
            Manage your MedSight workspace preferences.
          </p>
        </div>

        <div className="mt-6 grid gap-5">
          {/* Profile */}
          <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7047ff]/10 text-[#a990ff]">
                  <User size={16} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Profile
                  </h2>
                  <p className="mt-0.5 text-xs text-white/30">
                    Your clinical workspace identity
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <label className="text-[11px] text-white/30">
                  Name
                </label>

                <input
                  value="Dr. Sarah Johnson"
                  readOnly
                  className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-white/65 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-white/30">
                  Role
                </label>

                <input
                  value="Radiologist"
                  readOnly
                  className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-white/65 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-white/30">
                  Email
                </label>

                <input
                  value="sarah.johnson@medsight.local"
                  readOnly
                  className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-white/65 outline-none"
                />
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/45">
                  <Monitor size={16} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Appearance
                  </h2>
                  <p className="mt-0.5 text-xs text-white/30">
                    Configure how the workspace looks
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/[0.06]">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm text-white/70">
                    Dark theme
                  </div>
                  <div className="mt-1 text-xs text-white/30">
                    Optimized for clinical imaging workflows.
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/35">
                  <Moon size={14} />
                  Active
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm text-white/70">
                    Compact mode
                  </div>
                  <div className="mt-1 text-xs text-white/30">
                    Reduce spacing for higher information density.
                  </div>
                </div>

                <Toggle
                  enabled={settings.compactMode}
                  onChange={() => update("compactMode")}
                />
              </div>
            </div>
          </section>

          {/* AI */}
          <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7047ff]/10 text-[#a990ff]">
                  <Sparkles size={16} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    AI Preferences
                  </h2>
                  <p className="mt-0.5 text-xs text-white/30">
                    Control how AI assistance appears in your workspace
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/[0.06]">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm text-white/70">
                    AI suggestions
                  </div>
                  <div className="mt-1 text-xs text-white/30">
                    Show contextual AI suggestions while reviewing studies.
                  </div>
                </div>

                <Toggle
                  enabled={settings.aiSuggestions}
                  onChange={() => update("aiSuggestions")}
                />
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm text-white/70">
                    Report auto-save
                  </div>
                  <div className="mt-1 text-xs text-white/30">
                    Automatically save report drafts during editing.
                  </div>
                </div>

                <Toggle
                  enabled={settings.autoSave}
                  onChange={() => update("autoSave")}
                />
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/45">
                  <Bell size={16} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Notifications
                  </h2>
                  <p className="mt-0.5 text-xs text-white/30">
                    Choose which workspace events need your attention
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {[
                [
                  "notifications",
                  "Workspace notifications",
                  "Receive notifications for important workspace activity.",
                ],
                [
                  "reportNotifications",
                  "Report updates",
                  "Notify when reports are finalized or require attention.",
                ],
                [
                  "studyNotifications",
                  "Study updates",
                  "Notify when studies finish processing.",
                ],
                [
                  "emailNotifications",
                  "Email notifications",
                  "Receive selected notifications by email.",
                ],
              ].map(([key, title, description]) => (
                <div
                  key={key}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <div className="text-sm text-white/70">
                      {title}
                    </div>

                    <div className="mt-1 text-xs text-white/30">
                      {description}
                    </div>
                  </div>

                  <Toggle
                    enabled={
                      settings[key as keyof typeof settings]
                    }
                    onChange={() =>
                      update(key as keyof typeof settings)
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Security */}
          <section className="rounded-2xl border border-white/10 bg-[#0d1018]">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/45">
                  <Shield size={16} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Security
                  </h2>
                  <p className="mt-0.5 text-xs text-white/30">
                    Workspace and session security
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/[0.06]">
              <button className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.02]">
                <div>
                  <div className="text-sm text-white/70">
                    Active sessions
                  </div>
                  <div className="mt-1 text-xs text-white/30">
                    Review devices currently signed into your account.
                  </div>
                </div>

                <ChevronRight size={16} className="text-white/20" />
              </button>

              <button className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.02]">
                <div>
                  <div className="text-sm text-white/70">
                    Authentication
                  </div>
                  <div className="mt-1 text-xs text-white/30">
                    Manage authentication and account security.
                  </div>
                </div>

                <ChevronRight size={16} className="text-white/20" />
              </button>
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center justify-end gap-3 pb-6">
            {saved && (
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <Check size={14} />
                Settings saved
              </div>
            )}

            <button
              onClick={saveSettings}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#7047ff] px-5 text-sm font-medium text-white transition hover:bg-[#805cff]"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;