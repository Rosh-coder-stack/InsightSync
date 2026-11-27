import { useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Copy,
  Download,
  FileAudio,
  FileText,
  ListChecks,
  Loader2,
} from 'lucide-react';
import {
  formatDate,
  formatDuration,
  formatFileSizeMB,
  getActionItemStats,
} from '../utils/formatters';

const PRIORITY_BADGE_STYLES = {
  High: 'border-red-500/35 bg-gradient-to-r from-amber-500/15 to-red-500/15 text-red-300',
  Medium: 'border-borderSubtle bg-neutral-800/80 text-textPrimary',
  Low: 'border-borderSubtle/70 bg-neutral-900 text-textMuted',
};

function buildMarkdownBrief(meeting) {
  const decisions =
    meeting.keyDecisions?.length > 0
      ? meeting.keyDecisions.map((decision) => `- ${decision}`).join('\n')
      : '- No explicit key decisions captured.';

  const actions =
    meeting.actionItems?.length > 0
      ? meeting.actionItems
          .map((item) => {
            const checkbox = item.status === 'Completed' ? '[x]' : '[ ]';
            return `- ${checkbox} **${item.task}** — *Assignee:* ${item.assignee || 'Unassigned'} | *Priority:* ${item.priority || 'Medium'} | *Status:* ${item.status || 'Pending'}`;
          })
          .join('\n')
      : '- No action items captured.';

  return [
    `# ${meeting.title}`,
    '',
    `- **Date:** ${formatDate(meeting.createdAt, true)}`,
    `- **Duration:** ${formatDuration(meeting.durationSeconds)}`,
    `- **Source File:** ${meeting.originalFileName} (${formatFileSizeMB(meeting.fileSizeBytes)})`,
    '',
    '## Executive Overview',
    meeting.executiveOverview || '',
    '',
    '## Key Decisions',
    decisions,
    '',
    '## Action Items',
    actions,
    '',
    '## Raw Transcript',
    meeting.transcript || '',
  ].join('\n');
}

function slugifyFilename(title) {
  return (
    (title || 'meeting-intelligence')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'meeting-intelligence'
  );
}

/**
 * Structured intelligence workspace for the active meeting.
 */
function IntelligenceDashboard({
  meeting,
  togglingItemId = null,
  onToggleActionItem,
}) {
  const [copied, setCopied] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  if (!meeting) return null;

  const { total, completed } = getActionItemStats(meeting.actionItems);
  const transcriptText = meeting.transcript || '';
  const charCount = transcriptText.length;
  const wordCount = transcriptText.trim()
    ? transcriptText.trim().split(/\s+/).length
    : 0;

  const handleCopyMarkdown = async () => {
    try {
      const markdown = buildMarkdownBrief(meeting);
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in insecure contexts; fail quietly without crashing UI.
    }
  };

  const handleExportJson = () => {
    const cleanExport = {
      id: meeting._id,
      title: meeting.title,
      createdAt: meeting.createdAt,
      originalFileName: meeting.originalFileName,
      fileSizeBytes: meeting.fileSizeBytes,
      durationSeconds: meeting.durationSeconds,
      executiveOverview: meeting.executiveOverview,
      keyDecisions: meeting.keyDecisions || [],
      actionItems: (meeting.actionItems || []).map((item) => ({
        id: item._id,
        task: item.task,
        assignee: item.assignee,
        priority: item.priority,
        status: item.status,
      })),
      transcript: meeting.transcript || '',
    };

    const blob = new Blob([JSON.stringify(cleanExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slugifyFilename(meeting.title)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      {/* Header & Export Actions */}
      <div className="flex flex-col gap-4 border-b border-borderSubtle pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-textPrimary sm:text-2xl">
            {meeting.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-textMuted">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-accentAmber" />
              {formatDate(meeting.createdAt, true)}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-md border border-borderSubtle bg-surface px-2 py-0.5 tabular-nums text-textPrimary">
              <Clock className="h-3 w-3 text-accentAmber" />
              {formatDuration(meeting.durationSeconds)}
            </span>

            {meeting.originalFileName && (
              <span className="inline-flex max-w-xs items-center gap-1.5 truncate">
                <FileAudio className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{meeting.originalFileName}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
              copied
                ? 'border-accentAmber bg-accentAmber/15 text-accentAmber'
                : 'border-borderSubtle bg-surface text-textPrimary hover:border-neutral-600 hover:bg-white/[0.04]'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-textMuted" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-borderSubtle bg-surface px-3 py-2 text-xs font-medium text-textPrimary hover:border-accentAmber/60 hover:text-accentAmber"
          >
            <Download className="h-3.5 w-3.5 text-textMuted" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Executive Overview Card */}
      <section className="rounded-xl border border-borderSubtle bg-surface p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-accentAmber" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-textPrimary">
            Executive Overview
          </h2>
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-textPrimary/90">
          {meeting.executiveOverview}
        </p>
      </section>

      {/* Key Decisions Card */}
      <section className="rounded-xl border border-borderSubtle bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-accentAmber" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-textPrimary">
              Key Decisions
            </h2>
          </div>
          <span className="text-xs tabular-nums text-textMuted">
            {meeting.keyDecisions?.length || 0} recorded
          </span>
        </div>

        {meeting.keyDecisions && meeting.keyDecisions.length > 0 ? (
          <ul className="space-y-3">
            {meeting.keyDecisions.map((decision, idx) => (
              <li
                key={`${idx}-${decision.slice(0, 24)}`}
                className="flex items-start gap-3 text-sm leading-relaxed text-textPrimary/90"
              >
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accentAmber shadow-sm shadow-accentAmber/40" />
                <span>{decision}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-textMuted">
            No explicit decisions were detected in this recording.
          </p>
        )}
      </section>

      {/* Action Items Table / Checklist */}
      <section className="overflow-hidden rounded-xl border border-borderSubtle bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borderSubtle px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-accentAmber" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-textPrimary">
              Action Items
            </h2>
          </div>

          <span className="rounded-full border border-borderSubtle bg-canvas px-2.5 py-0.5 text-xs font-medium tabular-nums text-textMuted">
            <span className="text-accentAmber">{completed}</span> / {total} Completed
          </span>
        </div>

        {meeting.actionItems && meeting.actionItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-borderSubtle bg-canvas/50 text-[11px] font-semibold uppercase tracking-wider text-textMuted">
                  <th className="w-12 px-5 py-3 text-center">Done</th>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle/70">
                {meeting.actionItems.map((item) => {
                  const isCompleted = item.status === 'Completed';
                  const isToggling = togglingItemId === item._id;
                  const priorityStyle =
                    PRIORITY_BADGE_STYLES[item.priority] || PRIORITY_BADGE_STYLES.Medium;

                  return (
                    <tr
                      key={item._id}
                      className={`transition-colors hover:bg-white/[0.02] ${
                        isCompleted ? 'bg-canvas/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 text-center align-top">
                        <button
                          type="button"
                          onClick={() => onToggleActionItem(meeting._id, item._id)}
                          disabled={isToggling}
                          aria-label={`Mark "${item.task}" as ${
                            isCompleted ? 'Pending' : 'Completed'
                          }`}
                          className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border transition-all ${
                            isCompleted
                              ? 'border-accentAmber bg-accentAmber text-canvas'
                              : 'border-neutral-600 bg-canvas text-transparent hover:border-accentAmber'
                          } disabled:cursor-wait disabled:opacity-60`}
                        >
                          {isToggling ? (
                            <Loader2 className="h-3 w-3 animate-spin text-accentAmber" />
                          ) : (
                            <Check className="h-3.5 w-3.5 stroke-[2.75]" />
                          )}
                        </button>
                      </td>

                      <td className="min-w-[240px] px-4 py-3.5 align-top">
                        <span
                          className={`text-sm leading-snug ${
                            isCompleted
                              ? 'text-textMuted line-through'
                              : 'text-textPrimary'
                          }`}
                        >
                          {item.task}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="inline-flex items-center rounded-full border border-borderSubtle bg-canvas px-2.5 py-0.5 text-xs font-medium text-textPrimary">
                          {item.assignee || 'Unassigned'}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${priorityStyle}`}
                        >
                          {item.priority || 'Medium'}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-3.5 text-right align-top">
                        <span
                          className={`text-xs font-medium ${
                            isCompleted ? 'text-accentAmber' : 'text-textMuted'
                          }`}
                        >
                          {item.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-xs text-textMuted">
            No action items were extracted from this meeting.
          </div>
        )}
      </section>

      {/* Collapsible Raw Transcript Accordion */}
      <section className="overflow-hidden rounded-xl border border-borderSubtle bg-surface">
        <button
          type="button"
          onClick={() => setTranscriptOpen((prev) => !prev)}
          aria-expanded={transcriptOpen}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] sm:px-6"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-wider text-textPrimary">
              Raw Transcript
            </span>
            <span className="rounded-md border border-borderSubtle bg-canvas px-2 py-0.5 text-xs tabular-nums text-textMuted">
              {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-medium text-textMuted">
            <span>{transcriptOpen ? 'Collapse' : 'Expand'}</span>
            {transcriptOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>

        {transcriptOpen && (
          <div className="border-t border-borderSubtle bg-canvas/60 px-5 py-4 sm:px-6">
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-textPrimary/85">
              {transcriptText || 'No transcript available.'}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}

export default IntelligenceDashboard;
