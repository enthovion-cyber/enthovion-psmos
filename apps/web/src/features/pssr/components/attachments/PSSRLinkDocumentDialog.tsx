'use client';
import { useState } from 'react';
import { PSSRCard } from '../pssr-ui';

export function PSSRLinkDocumentDialog({ 
  selected,
  onLinkComplete
}: { 
  selected?: any;
  onLinkComplete?: (attachmentId: string, documentId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <PSSRCard title="Link to Document Control System">
      <div className="space-y-4">
        {/* Selection Information Callout */}
        <div className={`rounded-xl border p-4 transition-all ${
          selected 
            ? 'border-cyan-500/20 bg-cyan-500/5' 
            : 'border-white/5 bg-slate-950/20'
        }`}>
          {selected ? (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Target Attachment</span>
              <p className="mt-1 font-bold text-white">{selected.file_name}</p>
              <p className="mt-1 text-xs text-slate-400">
                Ready to link with Document Control instead of duplicating controlled records.
              </p>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm font-medium text-slate-400">
                Select an attachment from the grid below to link it with a controlled corporate document.
              </p>
            </div>
          )}
        </div>

        {/* Search & Link Actions (Only active when an attachment is selected) */}
        {selected && (
          <div className="space-y-3 pt-2 border-t border-white/5 animate-fadeIn">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Search Controlled Document Registry
            </label>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Document ID, Title, or Tag (e.g., SOP-2026-01)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <button 
                disabled={!searchQuery.trim()}
                onClick={() => onLinkComplete?.(selected.id, 'DOC-MOCK-ID')}
                className="shrink-0 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition-all hover:bg-cyan-400 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
              >
                Link Record
              </button>
            </div>
            
            <p className="text-[11px] text-slate-500 italic">
              Linking updates the file's metadata badge to "Linked" and associates its unique tracking GUID.
            </p>
          </div>
        )}
      </div>
    </PSSRCard>
  );
}