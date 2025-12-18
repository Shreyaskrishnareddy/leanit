'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles, Quote, RotateCcw } from 'lucide-react';
import { GlassCard, Badge } from '@/components/ui';
import type { Insight } from '@/types';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  insight: Insight;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  index: number;
}

export function SwipeableCard({
  insight,
  onSwipeLeft,
  onSwipeRight,
  isTop,
  index,
}: SwipeableCardProps) {
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Swipe indicator opacity
  const skipOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const diveOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);

  // Background color based on swipe direction
  const backgroundColor = useTransform(
    x,
    [-150, 0, 150],
    ['rgba(239, 68, 68, 0.15)', 'rgba(255, 255, 255, 0)', 'rgba(59, 130, 246, 0.15)']
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset < -threshold || velocity < -500) {
      setExitDirection('left');
      onSwipeLeft();
    } else if (offset > threshold || velocity > 500) {
      setExitDirection('right');
      onSwipeRight();
    }
  };

  // Stack effect - cards behind are slightly smaller and offset
  const scale = isTop ? 1 : 1 - index * 0.05;
  const yOffset = isTop ? 0 : index * 8;

  return (
    <motion.div
      className="absolute inset-0 touch-none"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale,
        y: yOffset,
        zIndex: 10 - index,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{
        scale,
        opacity: 1,
        y: yOffset,
      }}
      exit={{
        x: exitDirection === 'left' ? -300 : exitDirection === 'right' ? 300 : 0,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.3 }
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Swipe Indicators */}
      {isTop && (
        <>
          {/* Skip indicator (left) */}
          <motion.div
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            style={{ opacity: skipOpacity }}
          >
            <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg rotate-[-15deg]">
              SKIP
            </div>
          </motion.div>

          {/* Deep Dive indicator (right) */}
          <motion.div
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            style={{ opacity: diveOpacity }}
          >
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg rotate-[15deg]">
              DIVE IN
            </div>
          </motion.div>
        </>
      )}

      <motion.div style={{ backgroundColor }} className="h-full rounded-3xl">
        <GlassCard
          variant={insight.is_top_five ? 'highlighted' : 'default'}
          padding="lg"
          className="h-full flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant={insight.is_top_five ? 'primary' : 'default'} size="md">
              {insight.is_top_five && <Sparkles className="w-3 h-3 mr-1" />}
              Insight #{insight.rank}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 leading-tight">
            {insight.title}
          </h3>

          {/* Core Point */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed flex-grow">
            {insight.core_point}
          </p>

          {/* Supporting Quote */}
          {insight.supporting_context && (
            <div className="mt-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="flex gap-3">
                <Quote className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-500 italic leading-relaxed">
                  "{insight.supporting_context}"
                </p>
              </div>
            </div>
          )}

          {/* Swipe Hints */}
          {isTop && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <X className="w-4 h-4 text-red-400" />
                  <span>Swipe left to skip</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Swipe right to dive in</span>
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
