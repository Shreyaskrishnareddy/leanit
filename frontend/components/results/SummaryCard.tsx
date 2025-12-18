'use client';

import { FileText } from 'lucide-react';
import { GlassCard } from '@/components/ui';

interface SummaryCardProps {
  bullets: string[];
}

export function SummaryCard({ bullets }: SummaryCardProps) {
  return (
    <GlassCard variant="highlighted" padding="md" className="sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 text-blue-600">
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">Summary</h3>
      </div>

      <ul className="space-y-2 sm:space-y-3">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex gap-2 sm:gap-3 text-slate-700">
            <span className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
              {index + 1}
            </span>
            <span className="text-sm sm:text-base leading-relaxed">{bullet}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
