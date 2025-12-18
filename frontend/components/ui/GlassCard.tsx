'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted' | 'interactive';
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  padding = 'md',
  onClick,
}: GlassCardProps) {
  const baseStyles = `
    relative overflow-hidden rounded-2xl
    backdrop-blur-xl backdrop-saturate-150
    border border-white/20
    shadow-[0_8px_32px_rgba(0,0,0,0.08)]
    transition-all duration-300 ease-out
  `;

  const variantStyles = {
    default: `
      bg-white/70
      hover:bg-white/80
      hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]
    `,
    highlighted: `
      bg-gradient-to-br from-blue-500/10 to-indigo-500/10
      border-blue-200/30
      shadow-[0_8px_32px_rgba(59,130,246,0.15)]
      hover:shadow-[0_12px_40px_rgba(59,130,246,0.2)]
    `,
    interactive: `
      bg-white/60
      cursor-pointer
      hover:bg-white/80
      hover:scale-[1.02]
      hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]
      active:scale-[0.98]
    `,
  };

  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
