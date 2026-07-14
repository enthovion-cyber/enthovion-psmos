import { AlertTriangle, Calculator, CheckCircle2, GitBranch, Layers3, ShieldCheck, Sigma, Target, TimerReset } from 'lucide-react';
import type { LopaOverviewSummaryCard } from '../../types/lopa-overview.types';

const icons = [ShieldCheck, GitBranch, AlertTriangle, TimerReset, Layers3, CheckCircle2, Sigma, Calculator, Target];

export function LopaOverviewSummaryCards({ cards, onSelect }: { cards: LopaOverviewSummaryCard[]; onSelect?: ((tab?: string) => void) | undefined }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {cards.map((card, index) => {
        const Icon = icons[index % icons.length]!;
        const color = card.tone === 'danger' ? 'text-red-300' : card.tone === 'warning' ? 'text-amber-300' : card.tone === 'success' ? 'text-emerald-300' : card.tone === 'info' ? 'text-blue-300' : 'text-slate-300';
        return (
          <button key={card.key} onClick={() => onSelect?.(card.tab)} className="rounded-xl border border-cyan-300/10 bg-[#0b1d31] p-3 text-left shadow-xl shadow-black/10 transition hover:border-blue-400/30 hover:bg-[#102845]">
            <div className="flex items-center justify-between gap-3">
              <div className={`rounded-lg border border-current/15 bg-current/10 p-2 ${color}`}><Icon size={16} /></div>
              <span className="text-[10px] uppercase tracking-wide text-slate-500">{card.tab ?? 'overview'}</span>
            </div>
            <div className="mt-3 truncate text-xl font-bold text-white">{formatValue(card.value)}</div>
            <div className="mt-1 text-xs font-semibold text-slate-300">{card.label}</div>
          </button>
        );
      })}
    </section>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not available';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
