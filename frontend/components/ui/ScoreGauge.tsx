'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getScoreColor, getScoreBgColor, getScoreLabel } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ScoreGauge({
  score,
  size = 'md',
  showLabel = true,
  className,
}: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate the score on mount
  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const sizeConfig = {
    sm: { dimension: 80, strokeWidth: 6, fontSize: 'text-xl' },
    md: { dimension: 120, strokeWidth: 8, fontSize: 'text-3xl' },
    lg: { dimension: 160, strokeWidth: 10, fontSize: 'text-4xl' },
  };

  const { dimension, strokeWidth, fontSize } = sizeConfig[size];
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: dimension, height: dimension }}>
        {/* Background circle */}
        <svg className="transform -rotate-90" width={dimension} height={dimension}>
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200"
          />
          {/* Progress circle */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              'transition-all duration-1000 ease-out',
              getScoreBgColor(score).replace('bg-', 'text-')
            )}
          />
        </svg>

        {/* Score number in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', fontSize, getScoreColor(score))}>
            {animatedScore}
          </span>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <span
          className={cn(
            'font-semibold',
            size === 'sm' ? 'text-sm' : 'text-base',
            getScoreColor(score)
          )}
        >
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
