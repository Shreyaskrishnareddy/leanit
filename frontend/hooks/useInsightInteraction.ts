'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Insight } from '@/types';

interface UseInsightInteractionReturn {
  visibleInsights: Insight[];
  skippedIds: Set<string>;
  expandedId: string | null;
  skipInsight: (id: string) => void;
  expandInsight: (id: string) => void;
  collapseInsight: () => void;
  showMore: () => void;
  undoSkip: () => void;
  hasMore: boolean;
  showingAdditional: boolean;
  skippedCount: number;
  lastSkippedId: string | null;
}

export function useInsightInteraction(
  topInsights: Insight[],
  additionalInsights: Insight[]
): UseInsightInteractionReturn {
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showingAdditional, setShowingAdditional] = useState(false);
  const [lastSkippedId, setLastSkippedId] = useState<string | null>(null);

  const allInsights = useMemo(() => {
    return showingAdditional
      ? [...topInsights, ...additionalInsights]
      : topInsights;
  }, [topInsights, additionalInsights, showingAdditional]);

  const visibleInsights = useMemo(() => {
    return allInsights.filter((i) => !skippedIds.has(i.id));
  }, [allInsights, skippedIds]);

  const skipInsight = useCallback((id: string) => {
    setSkippedIds((prev) => new Set([...Array.from(prev), id]));
    setLastSkippedId(id);
    // Close expanded view if skipping the expanded insight
    setExpandedId((current) => (current === id ? null : current));
  }, []);

  const undoSkip = useCallback(() => {
    if (lastSkippedId) {
      setSkippedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lastSkippedId);
        return newSet;
      });
      setLastSkippedId(null);
    }
  }, [lastSkippedId]);

  const expandInsight = useCallback((id: string) => {
    setExpandedId(id);
  }, []);

  const collapseInsight = useCallback(() => {
    setExpandedId(null);
  }, []);

  const showMore = useCallback(() => {
    setShowingAdditional(true);
  }, []);

  return {
    visibleInsights,
    skippedIds,
    expandedId,
    skipInsight,
    expandInsight,
    collapseInsight,
    showMore,
    undoSkip,
    hasMore: !showingAdditional && additionalInsights.length > 0,
    showingAdditional,
    skippedCount: skippedIds.size,
    lastSkippedId,
  };
}
