import { Activity, AlertTriangle, CheckCircle2, Clock3, PauseCircle } from 'lucide-react';
import type { PermitDashboard } from '@/services/ptw.service';
import { toneClass } from './dashboard-ui';

export function PTWKpiCards({ dashboard, loading, onFilter }: { dashboard?: PermitDashboard | undefined; loading: boolean; onFilter: (filter: string) => void }) {
  const preferred = ['active', 'expiringSoon', 'conflicts', 'suspended', 'closedToday'];
  const source = dashboard?.kpis ?? [];
  const cards = preferred.map((key) => source.find((card) => card.key === key)).filter(Boolean) as Array<{ key: string; label: string; value: number; tone: string; filter: string }>;
  if (!loading && !cards.length) {
    return (
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
        {preferred.map((key) => (
          <div key={key} className="ptw-kpi border-slate-700/60 bg-slate-900/40">
            <div className="text-xs font-semibold text-slate-400">Waiting for live KPI data</div>
            <div className="mt-2 text-4xl font-bold text-slate-500">0</div>
            <div className="mt-2 text-xs text-slate-500">No fallback data</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <button key={card.key} className={`ptw-kpi group overflow-hidden text-left ${toneClass(card.tone).replace('text-', 'border-')}`} onClick={() => onFilter(card.filter)}>
          {loading ? <div className="h-20 animate-pulse rounded bg-white/5" /> : (
            <div className="relative">
              <div className="absolute -right-4 -top-5 h-20 w-20 rounded-full border border-white/10 bg-white/[.03] transition group-hover:scale-110" />
              <div className="flex items-start justify-between gap-3">
                <span className={`text-xs font-semibold ${toneClass(card.tone).split(' ')[0]}`}>{card.label}</span>
                <span className={`rounded-md border p-1.5 ${toneClass(card.tone)}`}><KpiIcon name={card.key} /></span>
              </div>
              <span className="mt-2 block text-4xl font-bold leading-none text-white">{card.value}</span>
              <span className="mt-2 block text-xs text-slate-300">View all</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function KpiIcon({ name }: { name: string }) {
  const props = { size: 16 };
  if (name === 'expiringSoon') return <Clock3 {...props} />;
  if (name === 'conflicts') return <AlertTriangle {...props} />;
  if (name === 'suspended') return <PauseCircle {...props} />;
  if (name === 'closedToday') return <CheckCircle2 {...props} />;
  return <Activity {...props} />;
}
