'use client';

import { Check, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { useCopilotStore } from '../stores/useCopilotStore';

export function CopilotSettingsModal() {
  const { isSettingsOpen, toggleSettings, preferences, updatePreferences, closeDrawer } = useCopilotStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/70 z-50 p-4 flex items-center justify-center animate-in fade-in duration-150">
      <div className="bg-[#0a1120] border border-slate-800 rounded-xl w-full max-w-sm p-4 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Workspace Preferences
            </h3>
          </div>
          <button
            type="button"
            onClick={toggleSettings}
            className="p-1 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Options */}
        <div className="space-y-3.5 text-xs">
          {/* Density */}
          <div className="space-y-1">
            <label className="font-medium text-slate-200">Display Density</label>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => updatePreferences({ density: 'comfortable' })}
                className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                  preferences.density === 'comfortable'
                    ? 'border-blue-500 bg-blue-950/60 text-blue-300'
                    : 'border-slate-800 hover:bg-[#0d1628] text-slate-400'
                }`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => updatePreferences({ density: 'compact' })}
                className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                  preferences.density === 'compact'
                    ? 'border-blue-500 bg-blue-950/60 text-blue-300'
                    : 'border-slate-800 hover:bg-[#0d1628] text-slate-400'
                }`}
              >
                Compact
              </button>
            </div>
          </div>

          {/* Enter key behavior */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="font-medium text-slate-200">Press Enter to Send</div>
              <p className="text-[10px] text-slate-400">
                {preferences.enterToSend ? 'Enter submits, Shift+Enter for new line' : 'Enter creates a new line'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.enterToSend}
              onChange={(e) => updatePreferences({ enterToSend: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Inline Citations */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="font-medium text-slate-200">Detailed Citation Cards</div>
              <p className="text-[10px] text-slate-400">Expand source excerpt previews inside responses</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.showInlineCitations}
              onChange={(e) => updatePreferences({ showInlineCitations: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        {/* Administrative Link */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Enterprise AI Governance:</span>
          <Link
            href="/settings/ai"
            onClick={() => {
              toggleSettings();
              closeDrawer();
            }}
            className="text-blue-400 hover:underline font-medium"
          >
            Manage Policies
          </Link>
        </div>
      </div>
    </div>
  );
}
