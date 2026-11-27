import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import Navbar from './components/Navbar';
import HistorySidebar from './components/HistorySidebar';
import UploadZone from './components/UploadZone';
import PipelineStatus from './components/PipelineStatus';
import IntelligenceDashboard from './components/IntelligenceDashboard';
import {
  deleteMeetingById,
  fetchMeetingById,
  fetchMeetings,
  getApiErrorMessage,
  processAudioFile,
  toggleActionItem,
} from './services/api';

function App() {
  const [meetings, setMeetings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMeeting, setActiveMeeting] = useState(null);

  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingFileMeta, setProcessingFileMeta] = useState(null);

  const [togglingItemId, setTogglingItemId] = useState(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  const stageTimerRef = useRef(null);
  const lastSearchRef = useRef('');

  const clearStageTimer = () => {
    if (stageTimerRef.current) {
      clearTimeout(stageTimerRef.current);
      stageTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearStageTimer();
  }, []);

  const loadMeetings = useCallback(async (query = '') => {
    try {
      const result = await fetchMeetings(query);
      const list = Array.isArray(result?.data) ? result.data : [];
      setMeetings(list);
      if (!query.trim()) {
        setTotalCount(typeof result?.count === 'number' ? result.count : list.length);
      }
    } catch (error) {
      setErrorBanner(getApiErrorMessage(error, 'Failed to load meeting history.'));
    } finally {
      setIsLoadingMeetings(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function syncMeetings() {
      try {
        const result = await fetchMeetings(searchQuery);
        if (!active) return;
        const list = Array.isArray(result?.data) ? result.data : [];
        setMeetings(list);
        if (!searchQuery.trim()) {
          setTotalCount(typeof result?.count === 'number' ? result.count : list.length);
        }
      } catch (error) {
        if (active) {
          setErrorBanner(getApiErrorMessage(error, 'Failed to load meeting history.'));
        }
      } finally {
        if (active) {
          setIsLoadingMeetings(false);
        }
      }
    }

    syncMeetings();

    return () => {
      active = false;
    };
  }, [searchQuery]);

  const handleSearchChange = useCallback((nextQuery) => {
    if (lastSearchRef.current === nextQuery) return;
    lastSearchRef.current = nextQuery;
    setIsLoadingMeetings(true);
    setSearchQuery(nextQuery);
  }, []);

  const handleNewAnalysis = () => {
    if (isProcessing) return;
    setActiveMeeting(null);
    setErrorBanner('');
    setIsSidebarOpen(false);
  };

  const handleSelectMeeting = async (id) => {
    if (isProcessing) return;
    setIsSidebarOpen(false);
    setErrorBanner('');

    if (activeMeeting?._id === id) return;

    setIsLoadingDetail(true);
    try {
      const result = await fetchMeetingById(id);
      setActiveMeeting(result.data);
    } catch (error) {
      setErrorBanner(getApiErrorMessage(error, 'Failed to load meeting details.'));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleProcessAudio = async (file) => {
    clearStageTimer();
    setErrorBanner('');
    setIsProcessing(true);
    setProcessingStage(1);
    setUploadProgress(0);
    setProcessingFileMeta({ name: file.name, size: file.size });

    let movedToStageTwo = false;

    try {
      const result = await processAudioFile(file, (progressEvent) => {
        if (!progressEvent.total) return;
        const percent = Math.min(
          100,
          Math.round((progressEvent.loaded * 100) / progressEvent.total)
        );
        setUploadProgress(percent);

        if (percent >= 100 && !movedToStageTwo) {
          movedToStageTwo = true;
          setProcessingStage(2);
          // Backend performs Whisper transcription followed by Gemini extraction in one request
          stageTimerRef.current = setTimeout(() => {
            setProcessingStage(3);
          }, 3000);
        }
      });

      const createdMeeting = result.data;
      setActiveMeeting(createdMeeting);
      setTotalCount((prev) => prev + 1);
      await loadMeetings(searchQuery);
    } catch (error) {
      setErrorBanner(
        getApiErrorMessage(error, 'Audio processing failed. Please try again.')
      );
    } finally {
      clearStageTimer();
      setIsProcessing(false);
      setUploadProgress(0);
      setProcessingStage(1);
      setProcessingFileMeta(null);
    }
  };

  const handleToggleActionItem = async (meetingId, itemId) => {
    setTogglingItemId(itemId);
    setErrorBanner('');

    try {
      const result = await toggleActionItem(meetingId, itemId);
      const updatedMeeting = result.data;

      setActiveMeeting((prev) =>
        prev?._id === meetingId ? updatedMeeting : prev
      );

      setMeetings((prev) =>
        prev.map((item) =>
          item._id === meetingId
            ? { ...item, actionItems: updatedMeeting.actionItems }
            : item
        )
      );
    } catch (error) {
      setErrorBanner(
        getApiErrorMessage(error, 'Failed to update action item status.')
      );
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleDeleteMeeting = async (id) => {
    setDeletingMeetingId(id);
    setErrorBanner('');

    try {
      await deleteMeetingById(id);
      setMeetings((prev) => prev.filter((item) => item._id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));

      if (activeMeeting?._id === id) {
        setActiveMeeting(null);
      }
    } catch (error) {
      setErrorBanner(getApiErrorMessage(error, 'Failed to delete meeting.'));
    } finally {
      setDeletingMeetingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-textPrimary">
      <Navbar
        meetingCount={totalCount}
        onNewAnalysis={handleNewAnalysis}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isProcessing={isProcessing}
      />

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <HistorySidebar
          meetings={meetings}
          activeMeetingId={activeMeeting?._id}
          isLoading={isLoadingMeetings}
          deletingMeetingId={deletingMeetingId}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectMeeting={handleSelectMeeting}
          onDeleteMeeting={handleDeleteMeeting}
          onSearchChange={handleSearchChange}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          {/* Global Error Toast / Banner */}
          {errorBanner && (
            <div
              role="alert"
              className="mx-auto mb-6 flex max-w-5xl items-start justify-between gap-3 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs text-red-200 sm:text-sm"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{errorBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorBanner('')}
                aria-label="Dismiss alert"
                className="shrink-0 rounded p-0.5 text-red-300 hover:bg-red-500/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {isProcessing ? (
            <PipelineStatus
              currentStage={processingStage}
              uploadProgress={uploadProgress}
              fileMeta={processingFileMeta}
            />
          ) : isLoadingDetail ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-textMuted">
              <Loader2 className="h-6 w-6 animate-spin text-accentAmber" />
              <p className="text-xs font-medium">Loading meeting intelligence...</p>
            </div>
          ) : activeMeeting ? (
            <IntelligenceDashboard
              key={activeMeeting._id}
              meeting={activeMeeting}
              togglingItemId={togglingItemId}
              onToggleActionItem={handleToggleActionItem}
            />
          ) : (
            <UploadZone onProcessAudio={handleProcessAudio} disabled={isProcessing} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
