'use client';

import { useEffect, useState } from 'react';
import { Loader2, FileText, Brain, Sparkles, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui';
import type { AnalysisProgress, ProgressStep } from '@/types';
import { cn, extractVideoId } from '@/lib/utils';

interface AnalysisLoaderProps {
  progress: AnalysisProgress;
  url: string;
}

interface StepInfo {
  icon: typeof Loader2;
  label: string;
  description: string;
}

const steps: Record<ProgressStep, StepInfo> = {
  idle: {
    icon: Loader2,
    label: 'Preparing',
    description: 'Getting ready to analyze...',
  },
  fetching: {
    icon: Loader2,
    label: 'Fetching',
    description: 'Getting video information...',
  },
  transcript: {
    icon: FileText,
    label: 'Transcript',
    description: 'Extracting video transcript...',
  },
  analyzing: {
    icon: Brain,
    label: 'Analyzing',
    description: 'Processing content with AI...',
  },
  generating: {
    icon: Sparkles,
    label: 'Generating',
    description: 'Creating insights and summary...',
  },
  complete: {
    icon: CheckCircle,
    label: 'Complete',
    description: 'Analysis finished!',
  },
};

const stepOrder: ProgressStep[] = [
  'fetching',
  'transcript',
  'analyzing',
  'generating',
  'complete',
];

export function AnalysisLoader({ progress, url }: AnalysisLoaderProps) {
  const [dots, setDots] = useState('');
  const videoId = extractVideoId(url);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const currentStepIndex = stepOrder.indexOf(progress.step);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <GlassCard className="w-full max-w-md" padding="lg">
        {/* Video thumbnail */}
        {videoId && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <img
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt="Video thumbnail"
              className="w-full h-40 object-cover"
            />
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-16 h-16 mb-4">
            {/* Spinning background */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
            <div
              className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
              style={{ animationDuration: '1s' }}
            />

            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {(() => {
                const Icon = steps[progress.step]?.icon || Loader2;
                return (
                  <Icon
                    className={cn(
                      'w-6 h-6',
                      progress.step === 'complete'
                        ? 'text-emerald-500'
                        : 'text-blue-500'
                    )}
                  />
                );
              })()}
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-800">
            {progress.message || steps[progress.step]?.description}
            {progress.step !== 'complete' && dots}
          </h3>
        </div>

        {/* Step indicators */}
        <div className="space-y-3">
          {stepOrder.map((step, index) => {
            const stepInfo = steps[step];
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div
                key={step}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-colors',
                  isCurrent && 'bg-blue-50',
                  isCompleted && 'opacity-60'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    isCompleted && 'bg-emerald-100 text-emerald-600',
                    isCurrent && 'bg-blue-100 text-blue-600',
                    !isCompleted && !isCurrent && 'bg-slate-100 text-slate-400'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <stepInfo.icon
                      className={cn('w-4 h-4', isCurrent && 'animate-pulse')}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isCurrent && 'text-blue-700',
                    isCompleted && 'text-slate-500',
                    !isCompleted && !isCurrent && 'text-slate-400'
                  )}
                >
                  {stepInfo.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400 text-center">
            {progress.percent}% complete
          </p>
        </div>
      </GlassCard>

      {/* Tip */}
      <p className="mt-6 text-sm text-slate-500 text-center max-w-sm">
        This usually takes 30-60 seconds depending on video length
      </p>
    </div>
  );
}
