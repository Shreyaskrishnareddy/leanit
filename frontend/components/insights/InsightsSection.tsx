'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, Undo2 } from 'lucide-react';
import { InsightCard } from './InsightCard';
import { Button, Badge } from '@/components/ui';
import { useInsightInteraction } from '@/hooks/useInsightInteraction';
import type { Insight } from '@/types';

interface InsightsSectionProps {
  topInsights: Insight[];
  additionalInsights: Insight[];
}

export function InsightsSection({
  topInsights,
  additionalInsights,
}: InsightsSectionProps) {
  const {
    visibleInsights,
    expandedId,
    skipInsight,
    expandInsight,
    collapseInsight,
    showMore,
    undoSkip,
    hasMore,
    skippedCount,
    lastSkippedId,
  } = useInsightInteraction(topInsights, additionalInsights);

  const handleDeepDive = (id: string) => {
    if (expandedId === id) {
      collapseInsight();
    } else {
      expandInsight(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Key Insights</h3>
          <Badge variant="default" size="sm">
            {visibleInsights.length} visible
          </Badge>
        </div>

        {/* Undo button */}
        {lastSkippedId && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Button variant="ghost" size="sm" onClick={undoSkip}>
              <Undo2 className="w-4 h-4 mr-1.5" />
              Undo skip
            </Button>
          </motion.div>
        )}
      </div>

      {/* Insight cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {visibleInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onSkip={skipInsight}
              onDeepDive={handleDeepDive}
              isExpanded={expandedId === insight.id}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Show more button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center pt-4"
        >
          <Button variant="secondary" size="md" onClick={showMore}>
            <ChevronDown className="w-4 h-4 mr-2" />
            Show {additionalInsights.length} more insights
          </Button>
        </motion.div>
      )}

      {/* Empty state */}
      {visibleInsights.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">
            All insights have been skipped.{' '}
            {skippedCount > 0 && (
              <button
                onClick={undoSkip}
                className="text-blue-600 hover:underline"
              >
                Undo last skip
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
