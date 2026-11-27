import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

/**
 * Extract a readable error message from an Axios or generic error.
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export function getApiErrorMessage(error, fallback = 'An unexpected error occurred.') {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      fallback
    );
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

/**
 * Upload an audio file to POST /meetings/process for transcription and intelligence extraction.
 * @param {File} file
 * @param {(progressEvent: import('axios').AxiosProgressEvent) => void} [onUploadProgress]
 */
export async function processAudioFile(file, onUploadProgress) {
  const formData = new FormData();
  formData.append('audio', file);

  const response = await api.post('/meetings/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });

  return response.data;
}

/**
 * Fetch saved meetings from GET /meetings with optional keyword search.
 * @param {string} [search='']
 */
export async function fetchMeetings(search = '') {
  const trimmed = search.trim();
  const response = await api.get('/meetings', {
    params: trimmed ? { search: trimmed } : undefined,
  });

  return response.data;
}

/**
 * Fetch a full meeting document (including transcript) from GET /meetings/:id.
 * @param {string} id
 */
export async function fetchMeetingById(id) {
  const response = await api.get(`/meetings/${id}`);
  return response.data;
}

/**
 * Toggle an action item's status between Pending and Completed via PATCH /meetings/:id/actions/:itemId.
 * @param {string} meetingId
 * @param {string} itemId
 */
export async function toggleActionItem(meetingId, itemId) {
  const response = await api.patch(`/meetings/${meetingId}/actions/${itemId}`);
  return response.data;
}

/**
 * Delete a meeting permanently via DELETE /meetings/:id.
 * @param {string} id
 */
export async function deleteMeetingById(id) {
  const response = await api.delete(`/meetings/${id}`);
  return response.data;
}

export default api;
