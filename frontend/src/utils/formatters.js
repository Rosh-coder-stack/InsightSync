/**
 * Format duration in seconds into a concise enterprise badge string (e.g. "12m 08s" or "1h 04m").
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds) || seconds <= 0) {
    return '0s';
  }

  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Format an ISO date string for display in lists or detail headers.
 * @param {string} isoString
 * @param {boolean} [includeTime=false]
 * @returns {string}
 */
export function formatDate(isoString, includeTime = false) {
  if (!isoString) return 'Unknown date';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  const options = includeTime
    ? {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }
    : {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      };

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format byte size in megabytes with two decimal places.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSizeMB(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) {
    return '0.00 MB';
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Compute total and completed action item counts.
 * @param {Array<{ status?: string }>} [actionItems=[]]
 * @returns {{ total: number, completed: number }}
 */
export function getActionItemStats(actionItems = []) {
  const total = actionItems.length;
  const completed = actionItems.filter((item) => item.status === 'Completed').length;
  return { total, completed };
}
