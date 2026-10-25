'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, Sparkles } from 'lucide-react';
import { useCopilotStore } from '../stores/useCopilotStore';

export function PSMCopilotFloatingButton() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isOpen, openDrawer } = useCopilotStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch from SSR / localStorage Zustand store
  if (!mounted) {
    return null;
  }

  // If already on the full-page Copilot view or drawer is open, hide the FAB
  if (pathname === '/copilot' || isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
      <button
        type="button"
        onClick={() => openDrawer()}
        className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#0b1426] hover:bg-[#101c34] text-white border border-blue-500/40 hover:border-blue-400/80 shadow-2xl shadow-blue-950/60 hover:shadow-blue-900/50 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Open Process Safety Copilot (Ctrl+Shift+K)"
        title="Open Process Safety Copilot (Ctrl+Shift+K)"
      >
        {/* Glowing Indicator Pulse */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
        </span>

        {/* Bot Icon */}
        <div className="p-1 rounded-full bg-blue-600/30 text-blue-400 group-hover:text-blue-300 transition-colors">
          <Bot className="w-4 h-4" />
        </div>

        {/* Label */}
        <span className="text-xs font-semibold tracking-wide text-slate-100 group-hover:text-white">
          PSM Copilot
        </span>

        {/* Keyboard Shortcut Badge */}
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-400 bg-slate-800/80 border border-slate-700/60 rounded">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}
