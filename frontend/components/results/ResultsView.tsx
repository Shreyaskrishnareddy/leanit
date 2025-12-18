'use client';

import { useState } from 'react';
import { ArrowLeft, Clock, LayoutGrid, Layers } from 'lucide-react';
import { Button } from '@/components/ui';
import { VideoMeta } from './VideoMeta';
import { SummaryCard } from './SummaryCard';
import { LeanScoreCard } from './LeanScoreCard';
import { InsightsSection } from '../insights/InsightsSection';
import { CardStack } from '../insights/CardStack';
import type { AnalysisResponse } from '@/types';
import { formatDuration } from '@/lib/utils';

interface ResultsViewProps {
  result: AnalysisResponse;
  onAnalyzeAnother: () => void;
}

export function ResultsView({ result, onAnalyzeAnother }: ResultsViewProps) {
  const [viewMode, setViewMode] = useState<'swipe' | 'list'>('swipe');

  return (
    <div className="animate-fade-in pb-12">
      {/* Header - Compact on mobile */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onAnalyzeAnother} className="px-2 sm:px-4">
          <ArrowLeft className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Analyze another</span>
        </Button>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('swipe')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'swipe'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Swipe mode"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="List mode"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(result.processing_time_ms)}</span>
          </div>
        </div>
      </div>

      {/* Video info - Compact on mobile */}
      <div className="mb-4">
        <VideoMeta metadata={result.metadata} />
      </div>

      {/* Summary and LeanScore - Stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SummaryCard bullets={result.summary_bullets} />
        <LeanScoreCard leanScore={result.lean_score} />
      </div>

      {/* Insights - Swipe mode (Tinder-style) or List mode */}
      {viewMode === 'swipe' ? (
        <CardStack
          topInsights={result.top_insights}
          additionalInsights={result.additional_insights}
        />
      ) : (
        <InsightsSection
          topInsights={result.top_insights}
          additionalInsights={result.additional_insights}
        />
      )}
    </div>
  );
}
