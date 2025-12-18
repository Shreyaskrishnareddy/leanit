'use client';

import { TrendingUp, BarChart3 } from 'lucide-react';
import { GlassCard, ScoreGauge, Badge } from '@/components/ui';
import type { LeanScore } from '@/types';
import { cn } from '@/lib/utils';

interface LeanScoreCardProps {
  leanScore: LeanScore;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const getBarColor = (val: number) => {
    if (val >= 80) return 'bg-emerald-500';
    if (val >= 60) return 'bg-blue-500';
    if (val >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-700">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            getBarColor(value)
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function LeanScoreCard({ leanScore }: LeanScoreCardProps) {
  return (
    <GlassCard padding="md" className="sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 text-indigo-600">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">LeanScore</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Score gauge */}
        <div className="shrink-0">
          <ScoreGauge score={leanScore.score} size="lg" />
        </div>

        {/* Score details */}
        <div className="flex-1 space-y-3 sm:space-y-4 w-full">
          {/* Reason */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-center sm:text-left">{leanScore.reason}</p>

          {/* Breakdown */}
          {leanScore.breakdown && (
            <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t border-slate-200">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-slate-500">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Score Breakdown</span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-3">
                <ScoreBar label="Density" value={leanScore.breakdown.density} />
                <ScoreBar label="Clarity" value={leanScore.breakdown.clarity} />
                <ScoreBar
                  label="Originality"
                  value={leanScore.breakdown.originality}
                />
                <ScoreBar
                  label="Signal/Noise"
                  value={leanScore.breakdown.signal_to_noise}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
