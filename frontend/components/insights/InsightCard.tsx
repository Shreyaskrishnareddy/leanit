'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronRight, Sparkles, Quote } from 'lucide-react';
import { GlassCard, Badge, Button } from '@/components/ui';
import type { Insight } from '@/types';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insight: Insight;
  onSkip: (id: string) => void;
  onDeepDive: (id: string) => void;
  isExpanded?: boolean;
}

export function InsightCard({
  insight,
  onSkip,
  onDeepDive,
  isExpanded = false,
}: InsightCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleSkip = () => {
    setIsDismissed(true);
    // Delay the actual skip to allow animation
    setTimeout(() => onSkip(insight.id), 300);
  };

  if (isDismissed) {
    return (
      <motion.div
        initial={{ opacity: 1, height: 'auto', marginBottom: 16 }}
        animate={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.3 }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <GlassCard
        variant={insight.is_top_five ? 'highlighted' : 'default'}
        padding="md"
      >
        {/* Header with rank */}
        <div className="flex items-start justify-between mb-3">
          <Badge variant={insight.is_top_five ? 'primary' : 'default'} size="md">
            {insight.is_top_five && <Sparkles className="w-3 h-3 mr-1" />}
            #{insight.rank}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          {insight.title}
        </h3>

        {/* Core point */}
        <p className="text-slate-600 leading-relaxed mb-4">{insight.core_point}</p>

        {/* Supporting context */}
        {insight.supporting_context && (
          <div className="flex gap-2 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <Quote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-500 italic">
              "{insight.supporting_context}"
            </p>
          </div>
        )}

        {/* Deep dive content (if expanded) */}
        {isExpanded && insight.deep_dive_content && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-slate-200"
          >
            <div className="space-y-4">
              {/* Extended explanation */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                  Deep Dive
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {insight.deep_dive_content.extended_explanation}
                </p>
              </div>

              {/* Key arguments */}
              {insight.deep_dive_content.key_arguments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Key Points
                  </h4>
                  <ul className="space-y-1">
                    {insight.deep_dive_content.key_arguments.map((arg, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-slate-600"
                      >
                        <span className="text-blue-500">•</span>
                        {arg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Local context */}
              {insight.deep_dive_content.local_context && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium text-slate-400 uppercase">
                      Before
                    </span>
                    <p className="text-sm text-slate-600 mt-1">
                      {insight.deep_dive_content.local_context.before}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium text-slate-400 uppercase">
                      After
                    </span>
                    <p className="text-sm text-slate-600 mt-1">
                      {insight.deep_dive_content.local_context.after}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-slate-500 hover:text-red-500 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1.5" />
            Skip
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeepDive(insight.id)}
            className={cn(
              'text-slate-500 hover:text-blue-600 hover:bg-blue-50',
              isExpanded && 'text-blue-600 bg-blue-50'
            )}
          >
            {isExpanded ? 'Collapse' : 'Deep dive'}
            <ChevronRight
              className={cn(
                'w-4 h-4 ml-1.5 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
