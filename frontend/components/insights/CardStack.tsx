'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronDown, Lightbulb, X, ChevronRight, CheckCircle } from 'lucide-react';
import { SwipeableCard } from './SwipeableCard';
import { DeepDiveSheet } from './DeepDiveSheet';
import { Button, Badge } from '@/components/ui';
import type { Insight } from '@/types';

interface CardStackProps {
  topInsights: Insight[];
  additionalInsights: Insight[];
}

export function CardStack({ topInsights, additionalInsights }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showingAdditional, setShowingAdditional] = useState(false);
  const [skippedInsights, setSkippedInsights] = useState<Insight[]>([]);
  const [savedInsights, setSavedInsights] = useState<Insight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [lastAction, setLastAction] = useState<{ type: 'skip' | 'save'; insight: Insight } | null>(null);

  const allInsights = showingAdditional
    ? [...topInsights, ...additionalInsights]
    : topInsights;

  const remainingInsights = allInsights.slice(currentIndex);
  const visibleCards = remainingInsights.slice(0, 3); // Show up to 3 stacked cards

  const handleSwipeLeft = useCallback(() => {
    const skipped = allInsights[currentIndex];
    setSkippedInsights((prev) => [...prev, skipped]);
    setLastAction({ type: 'skip', insight: skipped });
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, allInsights]);

  const handleSwipeRight = useCallback(() => {
    const saved = allInsights[currentIndex];
    setSavedInsights((prev) => [...prev, saved]);
    setLastAction({ type: 'save', insight: saved });
    setSelectedInsight(saved);
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, allInsights]);

  const handleUndo = useCallback(() => {
    if (lastAction && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      if (lastAction.type === 'skip') {
        setSkippedInsights((prev) => prev.slice(0, -1));
      } else {
        setSavedInsights((prev) => prev.slice(0, -1));
      }
      setLastAction(null);
    }
  }, [lastAction, currentIndex]);

  const handleShowMore = () => {
    setShowingAdditional(true);
  };

  const isFinished = currentIndex >= allInsights.length;
  const hasMoreToShow = !showingAdditional && additionalInsights.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-100 text-amber-600">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Key Insights</h3>
        </div>

        <div className="flex items-center gap-2">
          {savedInsights.length > 0 && (
            <Badge variant="success" size="sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              {savedInsights.length} saved
            </Badge>
          )}
          <Badge variant="default" size="sm">
            {currentIndex}/{allInsights.length}
          </Badge>
        </div>
      </div>

      {/* Card Stack Container */}
      <div className="relative flex-grow min-h-[400px] sm:min-h-[450px]">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((insight, index) => (
            <SwipeableCard
              key={insight.id}
              insight={insight}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              isTop={index === 0}
              index={index}
            />
          ))}
        </AnimatePresence>

        {/* Finished State */}
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              All caught up!
            </h3>
            <p className="text-slate-500 mb-6">
              You've reviewed {allInsights.length} insights.
              <br />
              {savedInsights.length} saved, {skippedInsights.length} skipped.
            </p>

            {hasMoreToShow && (
              <Button variant="primary" size="lg" onClick={handleShowMore}>
                <ChevronDown className="w-5 h-5 mr-2" />
                Show {additionalInsights.length} more insights
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Action Buttons (for non-touch users) */}
      {!isFinished && (
        <div className="flex items-center justify-center gap-4 mt-4 pb-4">
          {/* Undo Button */}
          <Button
            variant="ghost"
            size="md"
            onClick={handleUndo}
            disabled={!lastAction}
            className="w-12 h-12 rounded-full p-0"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          {/* Skip Button */}
          <Button
            variant="secondary"
            size="lg"
            onClick={handleSwipeLeft}
            className="w-16 h-16 rounded-full p-0 border-2 border-red-200 hover:border-red-400 hover:bg-red-50"
          >
            <X className="w-7 h-7 text-red-500" />
          </Button>

          {/* Save/Dive Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleSwipeRight}
            className="w-16 h-16 rounded-full p-0 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>

          {/* Placeholder for symmetry */}
          <div className="w-12 h-12" />
        </div>
      )}

      {/* Progress Bar */}
      {!isFinished && (
        <div className="px-4 pb-2">
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentIndex / allInsights.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Deep Dive Sheet */}
      <DeepDiveSheet
        insight={selectedInsight}
        isOpen={!!selectedInsight}
        onClose={() => setSelectedInsight(null)}
      />
    </div>
  );
}
