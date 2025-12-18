'use client';

import { useState, useCallback } from 'react';
import { analyzeVideo, ApiError } from '@/lib/api';
import type { AnalysisResponse, AnalysisProgress, ProgressStep } from '@/types';

interface UseAnalysisReturn {
  analyze: (url: string) => Promise<void>;
  result: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  errorCode: string | null;
  progress: AnalysisProgress;
  reset: () => void;
}

const initialProgress: AnalysisProgress = {
  step: 'idle',
  message: '',
  percent: 0,
};

const progressSteps: Record<ProgressStep, { message: string; percent: number }> = {
  idle: { message: '', percent: 0 },
  fetching: { message: 'Fetching video information...', percent: 10 },
  transcript: { message: 'Getting transcript...', percent: 25 },
  analyzing: { message: 'Analyzing content...', percent: 50 },
  generating: { message: 'Generating insights...', percent: 75 },
  complete: { message: 'Done!', percent: 100 },
};

export function useAnalysis(): UseAnalysisReturn {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>(initialProgress);

  const analyze = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setResult(null);
    setProgress({ ...progressSteps.fetching, step: 'fetching' });

    try {
      // Simulate progress updates while waiting for the API
      // In a real implementation, you'd use SSE or polling for actual progress
      const progressUpdates: ProgressStep[] = ['transcript', 'analyzing', 'generating'];
      let progressIndex = 0;

      const progressInterval = setInterval(() => {
        if (progressIndex < progressUpdates.length) {
          const step = progressUpdates[progressIndex];
          setProgress({ ...progressSteps[step], step });
          progressIndex++;
        }
      }, 5000); // Update every 5 seconds

      // Start the analysis
      const response = await analyzeVideo(url);

      // Clear the interval and set final progress
      clearInterval(progressInterval);
      setProgress({ ...progressSteps.complete, step: 'complete' });

      // Small delay before showing results for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      setResult(response);
    } catch (err) {
      let errorMessage = 'An unexpected error occurred';
      let code = 'UNKNOWN_ERROR';

      if (err instanceof ApiError) {
        errorMessage = err.message;
        code = err.errorCode;
        if (err.details) {
          errorMessage += `: ${err.details}`;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setErrorCode(code);
      setProgress(initialProgress);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setErrorCode(null);
    setProgress(initialProgress);
  }, []);

  return {
    analyze,
    result,
    isLoading,
    error,
    errorCode,
    progress,
    reset,
  };
}
