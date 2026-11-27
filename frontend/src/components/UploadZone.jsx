import { useRef, useState } from 'react';
import {
  AlertCircle,
  FileAudio,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { formatFileSizeMB } from '../utils/formatters';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.webm', '.ogg'];
const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/webm',
  'audio/ogg',
]);

function validateAudioFile(file) {
  if (!file) return 'Please select an audio file.';

  const fileName = (file.name || '').toLowerCase();
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const mimeType = (file.type || '').split(';')[0].trim().toLowerCase();
  const hasAllowedMime = !mimeType || ALLOWED_MIME_TYPES.has(mimeType);

  if (!hasAllowedExtension || !hasAllowedMime) {
    return 'Unsupported format. Please upload a .mp3, .wav, .m4a, .webm, or .ogg file.';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File exceeds the 25 MB limit (${formatFileSizeMB(file.size)}).`;
  }

  if (file.size === 0) {
    return 'The selected audio file is empty.';
  }

  return null;
}

/**
 * Drag-and-drop and click-to-browse audio upload zone with client-side validation.
 */
function UploadZone({ onProcessAudio, disabled = false }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleFileCandidate = (file) => {
    const error = validateAudioFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      return;
    }

    setValidationError('');
    setSelectedFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFile = event.dataTransfer?.files?.[0];
    if (droppedFile) {
      handleFileCandidate(droppedFile);
    }
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileCandidate(file);
    }
    event.target.value = '';
  };

  const handleRemoveFile = (event) => {
    event.stopPropagation();
    setSelectedFile(null);
    setValidationError('');
  };

  const handleSubmit = () => {
    if (!selectedFile || disabled) return;
    onProcessAudio(selectedFile);
  };

  const fileExtension = selectedFile?.name?.split('.').pop()?.toUpperCase() || 'AUDIO';

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col justify-center py-6 sm:py-12">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accentAmber/30 bg-accentAmber/10 px-3 py-1 text-xs font-medium text-accentAmber">
          <Sparkles className="h-3.5 w-3.5" />
          Whisper Large-v3 + Gemini 2.5 Flash
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-textPrimary sm:text-3xl">
          Turn Meeting Recordings into Structured Intelligence
        </h1>
        <p className="mt-2 text-sm text-textMuted">
          Drop a recording below to extract executive summaries, key decisions, owned action items, and a verbatim transcript.
        </p>
      </div>

      {/* Dropzone Card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative cursor-pointer rounded-xl border-2 border-dashed bg-surface p-8 text-center transition-all duration-200 sm:p-10 ${
          isDragging
            ? 'border-accentAmber bg-accentAmber/[0.05]'
            : 'border-borderSubtle hover:border-accentAmber'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center">
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                isDragging
                  ? 'border-accentAmber bg-accentAmber/15 text-accentAmber'
                  : 'border-borderSubtle bg-canvas text-textMuted group-hover:border-accentAmber/50 group-hover:text-accentAmber'
              }`}
            >
              <Upload className="h-5 w-5" />
            </div>

            <p className="text-sm font-medium text-textPrimary">
              Drag and drop your meeting audio here, or{' '}
              <span className="text-accentAmber underline underline-offset-4">
                browse files
              </span>
            </p>
            <p className="mt-2 text-xs text-textMuted">
              Supports <span className="text-textPrimary/80">.mp3, .wav, .m4a, .webm, .ogg</span> up to{' '}
              <span className="text-textPrimary/80">25 MB</span>
            </p>
          </div>
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-borderSubtle bg-canvas p-4 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accentAmber/30 bg-accentAmber/10 text-accentAmber">
                  <FileAudio className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-textPrimary">
                    {selectedFile.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-textMuted">
                    <span className="rounded border border-borderSubtle bg-surface px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-accentAmber">
                      {fileExtension}
                    </span>
                    <span className="tabular-nums">
                      {formatFileSizeMB(selectedFile.size)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                aria-label="Remove selected file"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-borderSubtle bg-surface text-textMuted hover:border-neutral-600 hover:text-textPrimary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-textMuted hover:text-textPrimary"
              >
                Choose a different file
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={disabled}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accentAmber px-5 py-2.5 text-sm font-semibold text-canvas shadow-sm shadow-accentAmber/20 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate Meeting Intelligence</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

export default UploadZone;
