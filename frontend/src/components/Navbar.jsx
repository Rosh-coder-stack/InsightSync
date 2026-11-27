import { AudioWaveform, Menu, Plus } from 'lucide-react';

/**
 * Minimalist top navigation bar with brand mark, meeting count badge, and New Analysis action.
 */
function Navbar({ meetingCount = 0, onNewAnalysis, onToggleSidebar, isProcessing = false }) {
  return (
    <header className="sticky top-0 z-30 h-14 w-full border-b border-borderSubtle bg-surface/90 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle meeting history sidebar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-borderSubtle bg-canvas text-textMuted hover:border-neutral-700 hover:text-textPrimary lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onNewAnalysis}
            disabled={isProcessing}
            className="group flex items-center gap-2.5 text-left disabled:cursor-not-allowed"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accentAmber/30 bg-accentAmber/10 text-accentAmber shadow-sm shadow-accentAmber/10">
              <AudioWaveform className="h-4 w-4" />
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight text-textPrimary sm:text-base">
                InsightSync
              </span>
              <span className="hidden text-xs font-medium text-textMuted sm:inline">
                Meeting Intelligence
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-borderSubtle bg-canvas px-2.5 py-1 text-xs font-medium text-textMuted"
            title="Total processed meetings"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accentAmber" />
            <span className="tabular-nums text-textPrimary">{meetingCount}</span>
            <span className="hidden xs:inline sm:inline">
              {meetingCount === 1 ? 'Meeting' : 'Meetings'}
            </span>
          </span>

          <button
            type="button"
            onClick={onNewAnalysis}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accentAmber/40 bg-accentAmber/10 px-3 py-1.5 text-xs font-semibold text-accentAmber hover:border-accentAmber hover:bg-accentAmber hover:text-canvas disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
