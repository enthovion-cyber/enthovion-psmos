'use client';

import { ArrowUpRight, CircleDot } from 'lucide-react';
import type { SearchResult } from '@/services/search.service';

export function SearchResultCard({ result, query, active, onSelect }: { result: SearchResult; query: string; active?: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-info bg-info/10 shadow-lg shadow-info/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface)] hover:border-info/50 hover:bg-[var(--psm-surface-2)]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-info/30 bg-info/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-info">{result.moduleKey}</span>
            {result.recordNumber ? <span className="text-xs font-semibold text-[var(--psm-muted)]">{highlight(result.recordNumber, query)}</span> : null}
            {result.status ? <StatusBadge value={result.status} /> : null}
            {result.priority ? <PriorityBadge value={result.priority} /> : null}
          </div>
          <div className="mt-2 truncate text-sm font-semibold text-[var(--psm-text)]">{highlight(result.title, query)}</div>
          {result.subtitle ? <div className="mt-1 truncate text-xs text-[var(--psm-muted)]">{highlight(result.subtitle, query)}</div> : null}
          {result.description ? <div className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--psm-muted)]">{highlight(result.description, query)}</div> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-[var(--psm-muted)]">
          <span>{new Date(result.updatedAt).toLocaleDateString()}</span>
          <ArrowUpRight size={15} />
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ value }: { value: string }) {
  const tone = value === 'ACTIVE' || value === 'CLOSED' ? 'text-success bg-success/10 border-success/30'
    : value.includes('OPEN') || value.includes('PROGRESS') ? 'text-warning bg-warning/10 border-warning/30'
      : value.includes('CANCEL') || value.includes('DEACT') ? 'text-danger bg-danger/10 border-danger/30'
        : 'text-[var(--psm-muted)] bg-[var(--psm-surface-2)] border-[var(--psm-line)]';
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tone}`}><CircleDot size={10} />{value.replaceAll('_', ' ')}</span>;
}

function PriorityBadge({ value }: { value: string }) {
  const tone = value === 'SAFETY_CRITICAL' || value === 'HIGH' ? 'text-danger bg-danger/10 border-danger/30'
    : value === 'MEDIUM' ? 'text-warning bg-warning/10 border-warning/30'
      : 'text-success bg-success/10 border-success/30';
  return <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{value.replaceAll('_', ' ')}</span>;
}

function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-warning/25 px-0.5 text-[var(--psm-text)]">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  );
}
