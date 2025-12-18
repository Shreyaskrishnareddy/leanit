'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, BookOpen, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import type { Insight } from '@/types';

interface DeepDiveSheetProps {
  insight: Insight | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeepDiveSheet({ insight, isOpen, onClose }: DeepDiveSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!insight) return null;

  const deepDive = insight.deep_dive_content;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pb-4 border-b border-slate-100">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">Deep Dive</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 leading-tight">
                  {insight.title}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full w-10 h-10 p-0 shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] overscroll-contain">
              <div className="px-5 py-6 space-y-6">
                {/* Core Point */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {insight.core_point}
                  </p>
                </div>

                {deepDive ? (
                  <>
                    {/* Extended Explanation */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        Extended Explanation
                      </h3>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                        {deepDive.extended_explanation}
                      </p>
                    </div>

                    {/* Key Arguments */}
                    {deepDive.key_arguments && deepDive.key_arguments.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                          Key Points
                        </h3>
                        <ul className="space-y-3">
                          {deepDive.key_arguments.map((arg, i) => (
                            <li key={i} className="flex gap-3">
                              <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </div>
                              <p className="text-slate-600 leading-relaxed">{arg}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Context */}
                    {deepDive.local_context && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          Context
                        </h3>
                        <div className="space-y-3">
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <span className="text-xs font-medium text-slate-400 uppercase">Before</span>
                            <p className="text-sm text-slate-600 mt-1">{deepDive.local_context.before}</p>
                          </div>
                          <div className="flex justify-center">
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <span className="text-xs font-medium text-slate-400 uppercase">After</span>
                            <p className="text-sm text-slate-600 mt-1">{deepDive.local_context.after}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Deep dive content not available for this insight.</p>
                  </div>
                )}

                {/* Supporting Quote */}
                {insight.supporting_context && (
                  <div className="p-4 border-l-4 border-blue-300 bg-blue-50/50 rounded-r-xl">
                    <p className="text-sm text-slate-500 italic">
                      "{insight.supporting_context}"
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom padding for safe area */}
              <div className="h-8" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
