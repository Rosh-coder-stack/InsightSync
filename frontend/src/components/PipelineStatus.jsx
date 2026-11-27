import { Check, FileAudio, Loader2 } from 'lucide-react';
import { formatFileSizeMB } from '../utils/formatters';

const PIPELINE_STEPS = [
  {
    id: 1,
    title: 'Uploading Audio Payload',
    description: 'Streaming encrypted audio file to the InsightSync ingestion endpoint.',
  },
  {
    id: 2,
    title: 'Transcribing Speech (Groq Whisper Large-v3)',
    description: 'Converting multi-speaker audio into a high-accuracy verbatim transcript.',
  },
  {
    id: 3,
    title: 'Extracting Structured Intelligence (Gemini 2.5 Flash)',
    description: 'Synthesizing executive overview, key decisions, and prioritized action items.',
  },
];

/**
 * Animated 3-stage progress stepper displayed during audio transcription and AI analysis.
 */
function PipelineStatus({ currentStage = 1, uploadProgress = 0, fileMeta }) {
  return (
    <div className="mx-auto w-full max-w-2xl py-8 sm:py-12">
      <div className="rounded-xl border border-borderSubtle bg-surface p-6 sm:p-8">
        {/* Header with active file info */}
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-borderSubtle pb-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accentAmber/40 bg-accentAmber/10 text-accentAmber">
              <FileAudio className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-accentAmber">
                Processing Pipeline Active
              </p>
              <p className="truncate text-sm font-semibold text-textPrimary">
                {fileMeta?.name || 'Meeting Recording'}
              </p>
            </div>
          </div>

          {fileMeta?.size ? (
            <span className="shrink-0 rounded-md border border-borderSubtle bg-canvas px-2.5 py-1 text-xs tabular-nums text-textMuted">
              {formatFileSizeMB(fileMeta.size)}
            </span>
          ) : null}
        </div>

        {/* 3-Stage Stepper */}
        <ol className="space-y-4">
          {PIPELINE_STEPS.map((step) => {
            const isCompleted = currentStage > step.id;
            const isActive = currentStage === step.id;

            return (
              <li
                key={step.id}
                className={`rounded-lg border p-4 transition-all duration-300 ${
                  isActive
                    ? 'border-accentAmber/60 bg-accentAmber/[0.06]'
                    : isCompleted
                    ? 'border-borderSubtle bg-canvas/60'
                    : 'border-borderSubtle/50 bg-canvas/30 opacity-55'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Stage Indicator Icon */}
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                      isCompleted
                        ? 'border-accentAmber bg-accentAmber text-canvas'
                        : isActive
                        ? 'border-accentAmber bg-accentAmber/15 text-accentAmber'
                        : 'border-borderSubtle bg-surface text-textMuted'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>

                  {/* Stage Text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-sm font-medium ${
                          isActive || isCompleted ? 'text-textPrimary' : 'text-textMuted'
                        }`}
                      >
                        {step.title}
                      </h3>

                      {step.id === 1 && isActive && (
                        <span className="text-xs font-semibold tabular-nums text-accentAmber">
                          {uploadProgress}%
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[11px] font-medium text-accentAmber">
                          Done
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-textMuted">{step.description}</p>

                    {/* Upload progress bar on Stage 1 */}
                    {step.id === 1 && isActive && (
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-borderSubtle">
                        <div
                          className="h-full rounded-full bg-accentAmber transition-all duration-200"
                          style={{ width: `${Math.max(uploadProgress, 5)}%` }}
                        />
                      </div>
                    )}

                    {/* Animated shimmer bar for AI stages */}
                    {step.id > 1 && isActive && (
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-borderSubtle">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-accentAmber/80" />
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export default PipelineStatus;
