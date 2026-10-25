'use client';

import { Bot, Sparkles } from 'lucide-react';
import { useCopilotStore } from '../stores/useCopilotStore';

export function PSMCopilotTriggerButton({ contextModule }: { contextModule?: string }) {
  const { openDrawer, isOpen } = useCopilotStore();

  return (
    <button
      onClick={() => openDrawer(contextModule)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-50/50 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold shadow-xs transition"
      title="Open Enthovion PSM Copilot"
    >
      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
      <span>PSM Copilot</span>
      <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
        AI
      </span>
    </button>
  );
}
