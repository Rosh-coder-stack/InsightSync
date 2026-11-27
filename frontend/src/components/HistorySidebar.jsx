import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { formatDate, formatDuration, getActionItemStats } from '../utils/formatters';

/**
 * Left sidebar housing debounced search and scrollable past meetings history.
 */
function HistorySidebar({
  meetings = [],
  activeMeetingId,
  isLoading = false,
  deletingMeetingId = null,
  isOpen = false,
  onClose,
  onSelectMeeting,
  onDeleteMeeting,
  onSearchChange,
}) {
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const handleDeleteClick = (event, id) => {
    event.stopPropagation();
    onDeleteMeeting(id);
  };

  const sidebarContent = (
    <aside className="flex h-full w-80 flex-col border-r border-borderSubtle bg-surface">
      {/* Sidebar Header & Debounced Search */}
      <div className="border-b border-borderSubtle p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-textMuted">
            Meeting History
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history sidebar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-textMuted hover:bg-white/5 hover:text-textPrimary lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-textMuted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search topics, decisions..."
            aria-label="Search meetings"
            className="w-full rounded-lg border border-borderSubtle bg-canvas py-2 pl-9 pr-8 text-xs text-textPrimary placeholder:text-textMuted/70 focus:border-accentAmber focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-textMuted hover:text-textPrimary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Meeting List */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((skeleton) => (
              <div
                key={skeleton}
                className="animate-pulse rounded-lg border border-borderSubtle/60 bg-canvas/60 p-3"
              >
                <div className="h-3.5 w-3/4 rounded bg-borderSubtle" />
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-3 w-16 rounded bg-borderSubtle/80" />
                  <div className="h-3 w-12 rounded bg-borderSubtle/80" />
                </div>
              </div>
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-borderSubtle px-4 py-10 text-center">
            <p className="text-xs font-medium text-textPrimary">
              {searchInput.trim() ? 'No matching meetings' : 'No meetings yet'}
            </p>
            <p className="mt-1 text-xs text-textMuted">
              {searchInput.trim()
                ? 'Try another keyword or clear your filter.'
                : 'Upload an audio recording to generate your first brief.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {meetings.map((meeting) => {
              const isActive = meeting._id === activeMeetingId;
              const isDeleting = deletingMeetingId === meeting._id;
              const { total, completed } = getActionItemStats(meeting.actionItems);

              return (
                <li key={meeting._id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectMeeting(meeting._id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectMeeting(meeting._id);
                      }
                    }}
                    className={`group relative cursor-pointer rounded-lg border p-3 transition-all ${
                      isActive
                        ? 'border-accentAmber/60 bg-accentAmber/[0.07]'
                        : 'border-borderSubtle/70 bg-canvas/40 hover:border-neutral-700 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`line-clamp-2 text-xs font-medium leading-snug ${
                          isActive ? 'text-textPrimary' : 'text-textPrimary/90'
                        }`}
                      >
                        {meeting.title}
                      </h3>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, meeting._id)}
                        disabled={isDeleting}
                        aria-label={`Delete ${meeting.title}`}
                        title="Delete meeting"
                        className="shrink-0 rounded p-1 text-textMuted opacity-70 transition-opacity hover:bg-red-500/10 hover:text-red-400 focus:opacity-100 disabled:opacity-50 lg:opacity-0 lg:group-hover:opacity-100"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-textMuted">
                      <span>{formatDate(meeting.createdAt)}</span>

                      <span className="inline-flex items-center gap-1 rounded border border-borderSubtle bg-surface px-1.5 py-0.5 tabular-nums">
                        <Clock className="h-2.5 w-2.5 text-textMuted" />
                        {formatDuration(meeting.durationSeconds)}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 tabular-nums ${
                          total > 0 && completed === total
                            ? 'border-accentAmber/40 bg-accentAmber/10 text-accentAmber'
                            : 'border-borderSubtle bg-surface text-textMuted'
                        }`}
                        title="Completed action items"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {completed}/{total}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <div className="hidden h-[calc(100vh-3.5rem)] shrink-0 lg:sticky lg:top-14 lg:block">
        {sidebarContent}
      </div>

      {/* Mobile slide-over drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}

export default HistorySidebar;
