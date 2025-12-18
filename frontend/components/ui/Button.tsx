'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center
      font-medium rounded-xl
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantStyles = {
      primary: `
        bg-gradient-to-r from-blue-500 to-blue-600
        text-white
        hover:from-blue-600 hover:to-blue-700
        focus:ring-blue-500
        shadow-lg shadow-blue-500/25
        hover:shadow-xl hover:shadow-blue-500/30
      `,
      secondary: `
        bg-white/80 backdrop-blur-sm
        text-slate-700
        border border-slate-200
        hover:bg-white hover:border-slate-300
        focus:ring-slate-400
      `,
      ghost: `
        bg-transparent
        text-slate-600
        hover:bg-slate-100
        focus:ring-slate-400
      `,
      danger: `
        bg-gradient-to-r from-red-500 to-red-600
        text-white
        hover:from-red-600 hover:to-red-700
        focus:ring-red-500
        shadow-lg shadow-red-500/25
      `,
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-base gap-2',
      lg: 'px-8 py-3.5 text-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
