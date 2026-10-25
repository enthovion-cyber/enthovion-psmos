'use client';

import { CheckCircle2, ExternalLink, FileText, Lock, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useCopilotStore } from '../stores/useCopilotStore';
import type { AiSource } from '../types';

export function CopilotEvidenceInspector() {
  const { inspectingSource, setInspectingSource } = useCopilotStore();

  if (!inspectingSource) return null;

  const s = inspectingSource;

  return (
    <div className="absolute inset-y-0 right-0 w-full sm:w-[380px] bg-[#070c18] border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0a1120]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Evidence Inspector
          </h3>
          <span className="font-mono text-xs font-bold text-blue-400">
            [{s.id}]
          </span>
        </div>
        <button
          type="button"
          onClick={() => setInspectingSource(null)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inspector Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Source Title & Provenance */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-950/60 text-blue-300 border border-blue-800">
              {s.recordType}
            </span>
            {s.status && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {s.status}
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-slate-100 leading-snug">
            {s.title}
          </h4>
          <div className="text-[11px] font-mono text-slate-500">
            ID: {s.recordId}
          </div>
        </div>

        {/* Verifiable Excerpt / Snippet */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
            Verified Extracted Evidence
          </span>
          <div className="p-3 rounded-lg bg-[#0d1628] border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap">
            {s.snippet}
          </div>
        </div>

        {/* Provenance & Authoritative Link */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authoritative record retrieved via tenant-isolated semantic pgvector search.</span>
          </div>

          {s.url ? (
            <Link
              href={s.url}
              onClick={() => setInspectingSource(null)}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-xs cursor-pointer"
            >
              <span>Open Authoritative Record</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="p-2.5 rounded bg-[#0d1628] border border-slate-800 text-[11px] text-slate-500 text-center">
              Direct deep link unavailable in this module context.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
