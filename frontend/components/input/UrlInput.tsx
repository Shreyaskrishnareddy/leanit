'use client';

import { useState, useEffect } from 'react';
import { Search, Link2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, isValidYouTubeUrl } from '@/lib/utils';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string | null;
  disabled?: boolean;
}

export function UrlInput({
  value,
  onChange,
  onSubmit,
  error,
  disabled = false,
}: UrlInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate URL on change
  useEffect(() => {
    if (value && !isValidYouTubeUrl(value)) {
      setValidationError('Please enter a valid YouTube URL');
    } else {
      setValidationError(null);
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationError && value.trim()) {
      onSubmit();
    }
  };

  const displayError = error || validationError;
  const isValid = value && !validationError;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div
        className={cn(
          'relative flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl transition-all duration-300',
          'bg-white/80 backdrop-blur-xl',
          'border-2',
          isFocused
            ? 'border-blue-400 shadow-lg shadow-blue-500/10'
            : 'border-slate-200 shadow-md',
          displayError && 'border-red-300'
        )}
      >
        {/* Icon - Hidden on mobile */}
        <div
          className={cn(
            'hidden sm:flex items-center justify-center w-10 h-10 rounded-xl transition-colors',
            isFocused ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
          )}
        >
          <Link2 className="w-5 h-5" />
        </div>

        {/* Input */}
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Paste YouTube URL..."
          disabled={disabled}
          className={cn(
            'flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400',
            'text-base sm:text-lg py-2 px-2 sm:px-0',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={disabled || !isValid}
          className="shrink-0 px-3 sm:px-4"
        >
          <Search className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Analyze</span>
        </Button>
      </div>

      {/* Error message */}
      {displayError && (
        <div className="flex items-center gap-2 mt-2 sm:mt-3 text-red-500 text-xs sm:text-sm animate-fade-in px-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Helper text */}
      {!displayError && (
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-400 text-center">
          Works with YouTube videos up to 2 hours long
        </p>
      )}
    </form>
  );
}
