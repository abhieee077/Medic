import {
  Brain,
  ChevronDown,
  Maximize2,
  MoreHorizontal,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Send,
} from "lucide-react";

function Workspace() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#090b12]">

      {/* =========================================================
          PATIENT / STUDY HEADER
      ========================================================= */}
      <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/10 bg-[#0d1018] px-5">

        <div className="flex items-center gap-6">

          {/* Patient */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-white">
                John Doe
              </span>

              <span className="text-xs text-white/35">
                MRN 987654
              </span>
            </div>

            <div className="mt-1 text-[11px] text-white/40">
              Male · 45Y · May 12, 1980
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          {/* Study */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/30">
              Study
            </div>

            <div className="mt-1 text-sm font-medium text-white">
              MRI Brain w/ Contrast
            </div>
          </div>

          {/* Accession */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/30">
              Accession No.
            </div>

            <div className="mt-1 font-mono text-xs text-white/70">
              MR20250420-001
            </div>
          </div>

          {/* Modality */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/30">
              Modality
            </div>

            <div className="mt-1 text-xs font-medium text-white">
              MR
            </div>
          </div>

        </div>

        <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.06] hover:text-white">
          View All Studies
          <ChevronDown size={14} />
        </button>

      </header>


      {/* =========================================================
          MAIN WORKSPACE
      ========================================================= */}
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_235px]">

        {/* =======================================================
            VIEWER + AI
        ======================================================= */}
        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_380px]">

          {/* =====================================================
              LEFT: VIEWER + FINDINGS
          ===================================================== */}
          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_115px]">

            {/* ================= VIEWER ================= */}
            <section className="relative min-h-0 overflow-hidden bg-[#05070c]">

              {/* Viewer toolbar */}
              <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">

                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#11141c]/90 p-1.5 shadow-xl backdrop-blur">

                  <button
                    title="Zoom in"
                    className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <ZoomIn size={16} />
                  </button>

                  <button
                    title="Zoom out"
                    className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <ZoomOut size={16} />
                  </button>

                  <button
                    title="Reset"
                    className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <div className="mx-1 h-5 w-px bg-white/10" />

                  <button
                    title="Fullscreen"
                    className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <Maximize2 size={16} />
                  </button>

                </div>

                <button className="rounded-lg border border-white/10 bg-[#11141c]/90 p-2 text-white/45 transition hover:text-white">
                  <MoreHorizontal size={17} />
                </button>

              </div>


              {/* Empty viewer */}
              <div className="flex h-full items-center justify-center">

                <div className="text-center">

                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025]">

                    <Brain
                      size={29}
                      strokeWidth={1.5}
                      className="text-[#8b68ff]"
                    />

                  </div>

                  <h2 className="text-lg font-medium text-white">
                    No Study Loaded
                  </h2>

                  <p className="mt-1 text-sm text-white/35">
                    Upload or select a study to begin.
                  </p>

                  <button className="mt-5 rounded-lg bg-[#7047ff] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#805cff]">
                    Select Study
                  </button>

                </div>

              </div>


              {/* Viewer status */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-white/30">

                <span>
                  WW: 1200 · WL: 600
                </span>

                <span>
                  Image 1 / 192
                </span>

              </div>

            </section>


            {/* ================= FINDINGS ================= */}
            <section className="min-h-0 overflow-hidden border-t border-white/10 bg-[#0d1018]">

              <div className="flex h-full items-center justify-between px-4">

                <div>
                  <div className="text-sm font-medium text-white">
                    AI Findings
                  </div>

                  <p className="mt-1 text-xs text-white/30">
                    AI-generated findings will appear here.
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-[10px] text-white/30">
                  No findings
                </div>

              </div>

            </section>

          </div>


          {/* =====================================================
              RIGHT: AI ASSISTANT
          ===================================================== */}
          <aside className="grid min-h-0 grid-rows-[62px_minmax(0,1fr)_68px] border-l border-white/10 bg-[#0d1018]">

            {/* AI Header */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7047ff]/15">
                <Brain
                  size={16}
                  className="text-[#9b7cff]"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-white">
                  Medic AI Assistant
                </div>

                <div className="text-[10px] text-white/30">
                  AI Copilot
                </div>
              </div>

              <button className="ml-auto text-white/30 hover:text-white">
                <MoreHorizontal size={17} />
              </button>

            </div>


            {/* AI Content — independently scrollable */}
            <div className="min-h-0 overflow-y-auto p-4">

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">

                <div className="text-sm font-medium text-white">
                  Hello, Doctor 👋
                </div>

                <p className="mt-2 text-xs leading-5 text-white/40">
                  I'm ready to assist with your imaging workflow.
                  Upload a study to begin.
                </p>

              </div>


              <div className="mt-4 space-y-2">

                <button className="w-full rounded-lg border border-white/10 bg-white/[0.015] px-3 py-2.5 text-left text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white">
                  Analyze Study
                </button>

                <button className="w-full rounded-lg border border-white/10 bg-white/[0.015] px-3 py-2.5 text-left text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white">
                  Compare Previous Study
                </button>

                <button className="w-full rounded-lg border border-white/10 bg-white/[0.015] px-3 py-2.5 text-left text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white">
                  Generate Draft Report
                </button>

              </div>


              <div className="mt-6 border-t border-white/10 pt-4">

                <div className="mb-3 text-[10px] uppercase tracking-wider text-white/25">
                  Suggested
                </div>

                <div className="flex flex-wrap gap-2">

                  <button className="rounded-lg bg-white/[0.035] px-3 py-2 text-[10px] text-white/40 hover:bg-white/[0.06] hover:text-white">
                    Summarize study
                  </button>

                  <button className="rounded-lg bg-white/[0.035] px-3 py-2 text-[10px] text-white/40 hover:bg-white/[0.06] hover:text-white">
                    Explain findings
                  </button>

                </div>

              </div>

            </div>


            {/* Chat Input — fixed */}
            <div className="border-t border-white/10 p-3">

              <div className="flex h-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3">

                <input
                  type="text"
                  placeholder="Ask anything about this study..."
                  className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25"
                />

                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/10 hover:text-white">
                  <Send size={15} />
                </button>

              </div>

            </div>

          </aside>

        </div>


        {/* =======================================================
            REPORT EDITOR
        ======================================================= */}
        <section className="min-h-0 overflow-hidden border-t border-white/10 bg-[#0d1018]">

          {/* Report Header */}
          <div className="flex h-[52px] items-center justify-between border-b border-white/10 px-4">

            <div className="flex items-center gap-3">

              <div className="text-sm font-medium text-white">
                Report Editor
              </div>

              <span className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/30">
                Draft
              </span>

            </div>

            <div className="flex items-center gap-2">

              <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/45 hover:bg-white/5 hover:text-white">
                Templates
              </button>

              <button className="rounded-lg bg-[#7047ff] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#805cff]">
                Save Draft
              </button>

            </div>

          </div>


          {/* Report fields */}
          <div className="grid h-[calc(100%-52px)] grid-cols-2 gap-4 p-4">

            {/* Findings */}
            <div className="flex min-h-0 flex-col">

              <label className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                Findings
              </label>

              <textarea
                placeholder="Document imaging findings..."
                className="mt-2 min-h-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-white outline-none placeholder:text-white/20 transition focus:border-[#7047ff]/50"
              />

            </div>


            {/* Impression */}
            <div className="flex min-h-0 flex-col">

              <label className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                Impression
              </label>

              <textarea
                placeholder="Enter impression..."
                className="mt-2 min-h-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-white outline-none placeholder:text-white/20 transition focus:border-[#7047ff]/50"
              />

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Workspace;