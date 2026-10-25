'use client';

import {
  Bot,
  ChevronDown,
  History,
  Maximize2,
  Minimize2,
  Plus,
  Settings,
  Sparkles,
  X
} from 'lucide-react';
import { useCopilotStore } from '../stores/useCopilotStore';
import type { AiStatusResponse } from '../types';

interface CopilotHeaderProps {
  status?: AiStatusResponse | undefined;
  activeTitle: string;
}

export function CopilotHeader({ status, activeTitle }: CopilotHeaderProps) {
  const {
    isExpanded,
    toggleExpanded,
    isHistoryOpen,
    toggleHistory,
    isSettingsOpen,
    toggleSettings,
    createSession,
    closeDrawer,
    contextModule
  } = useCopilotStore();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800/90 bg-[#0a1120] shrink-0 select-none">
      {/* Brand & Active Session Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/40 shadow-xs shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100 tracking-tight truncate">
              PSM Copilot
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {status?.model || 'gpt-4o'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {activeTitle || 'Industrial Process Safety Workspace'}
          </p>
        </div>
      </div>

      {/* Primary Actions & Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => createSession(contextModule || undefined)}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition flex items-center gap-1 text-xs font-medium cursor-pointer"
          title="Start New Conversation"
          aria-label="Start New Conversation"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline text-[11px]">New</span>
        </button>

        <button
          type="button"
          onClick={toggleHistory}
          className={`p-1.5 rounded-md transition cursor-pointer ${
            isHistoryOpen
              ? 'text-blue-400 bg-blue-950/60 border border-blue-800/50'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
          title="Conversation History"
          aria-label="Conversation History"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleSettings}
          className={`p-1.5 rounded-md transition cursor-pointer ${
            isSettingsOpen
              ? 'text-blue-400 bg-blue-950/60 border border-blue-800/50'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
          title="Workspace Settings"
          aria-label="Workspace Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={toggleExpanded}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition hidden sm:inline-flex cursor-pointer"
          title={isExpanded ? 'Standard Width (520px)' : 'Expanded Workspace (860px)'}
          aria-label={isExpanded ? 'Collapse Drawer Width' : 'Expand Drawer Width'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={closeDrawer}
          className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
          title="Close Copilot (Esc)"
          aria-label="Close Copilot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
