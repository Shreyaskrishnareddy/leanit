'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Container } from '@/components/layout/Container';
import { UrlInput } from '@/components/input/UrlInput';
import { AnalysisLoader } from '@/components/loading/AnalysisLoader';
import { ResultsView } from '@/components/results/ResultsView';
import { useAnalysis } from '@/hooks/useAnalysis';

export default function Home() {
  const [url, setUrl] = useState('');
  const { analyze, result, isLoading, error, progress, reset } = useAnalysis();

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    await analyze(url);
  };

  const handleReset = () => {
    setUrl('');
    reset();
  };

  return (
    <main className="min-h-[100dvh] flex flex-col">
      <Header />

      <Container className="py-4 sm:py-8 flex-grow">
        {/* Initial State - URL Input */}
        {!isLoading && !result && (
          <div className="flex flex-col items-center justify-center min-h-[60dvh] animate-fade-in px-2">
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4">
                Learn smarter,{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  not longer
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-lg mx-auto">
                Paste a YouTube URL to extract key insights from any podcast,
                interview, or lecture in seconds.
              </p>
            </div>

            <UrlInput
              value={url}
              onChange={setUrl}
              onSubmit={handleAnalyze}
              error={error}
              disabled={isLoading}
            />

            {/* Feature highlights - Hidden on very small screens */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-2xl">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Fast Analysis</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Get insights in under 60 seconds
                </p>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Literal Extraction</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Grounded in what was actually said
                </p>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl bg-amber-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base">LeanScore</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Know if a video is worth your time
                </p>
              </div>
            </div>

            {/* Mobile feature chips */}
            <div className="flex sm:hidden flex-wrap justify-center gap-2 mt-8">
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                Fast Analysis
              </span>
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                Literal Extraction
              </span>
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                LeanScore
              </span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <AnalysisLoader progress={progress} url={url} />}

        {/* Results State */}
        {result && !isLoading && (
          <ResultsView result={result} onAnalyzeAnother={handleReset} />
        )}
      </Container>

      {/* Footer - Hide on mobile when showing results */}
      <footer className={`py-4 sm:py-8 text-center text-xs sm:text-sm text-slate-400 ${result ? 'hidden sm:block' : ''}`}>
        <p>LeanIt - Extract insights from YouTube videos</p>
      </footer>
    </main>
  );
}
