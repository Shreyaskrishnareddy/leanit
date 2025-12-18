'use client';

import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full py-3 sm:py-6 px-4 shrink-0">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            LeanIt
          </span>
        </div>
      </div>
    </header>
  );
}
