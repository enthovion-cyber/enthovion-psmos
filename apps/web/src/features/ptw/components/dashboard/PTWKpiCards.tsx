import { Activity, AlertTriangle, CheckCircle2, Clock3, PauseCircle } from 'lucide-react';
import type { PermitDashboard } from '@/services/ptw.service';

const KPI_CONFIG: Record<string, { label: string; icon: typeof Activity; lightTone: string; darkTone: string; lightBadge: string; darkBadge: string }> = {
  active: {
    label: 'Active Permits',
    icon: Activity,
    lightTone: 'border-emerald-200/80 bg-white hover:border-emerald-300',
    darkTone: 'dark:border-emerald-500/20 dark:bg-slate-900/40 dark:hover:border-emerald-500/40',
    lightBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    darkBadge: 'dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
  },
  expiringSoon: {
    label: 'Expiring Within 2 Hrs',
    icon: Clock3,
    lightTone: 'border-amber-200/80 bg-white hover:border-amber-300',
    darkTone: 'dark:border-amber-500/20 dark:bg-slate-900/40 dark:hover:border-amber-500/40',
    lightBadge: 'bg-amber-50 text-amber-700 border-amber-200',
    darkBadge: 'dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
  },
  conflicts: {
    label: 'Conflicts Detected',
    icon: AlertTriangle,
    lightTone: 'border-rose-200/80 bg-white hover:border-rose-300',
    darkTone: 'dark:border-rose-500/20 dark:bg-slate-900/40 dark:hover:border-rose-500/40',
    lightBadge: 'bg-rose-50 text-rose-700 border-rose-200',
    darkBadge: 'dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
  },
  suspended: {
    label: 'Suspended Permits',
    icon: PauseCircle,
    lightTone: 'border-purple-200/80 bg-white hover:border-purple-300',
    darkTone: 'dark:border-purple-500/20 dark:bg-slate-900/40 dark:hover:border-purple-500/40',
    lightBadge: 'bg-purple-50 text-purple-700 border-purple-200',
    darkBadge: 'dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30'
  },
  closedToday: {
    label: 'Closed Today',
    icon: CheckCircle2,
    lightTone: 'border-sky-200/80 bg-white hover:border-sky-300',
    darkTone: 'dark:border-sky-500/20 dark:bg-slate-900/40 dark:hover:border-sky-500/40',
    lightBadge: 'bg-sky-50 text-sky-700 border-sky-200',
    darkBadge: 'dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30'
  }
};

export function PTWKpiCards({
  dashboard,
  loading,
  onFilter
}: {
  dashboard?: PermitDashboard | undefined;
  loading: boolean;
  onFilter: (filter: string) => void;
}) {
  const preferred = ['active', 'expiringSoon', 'conflicts', 'suspended', 'closedToday'];
  const source = dashboard?.kpis ?? [];
  const cards = preferred
    .map((key) => {
      const match = source.find((card) => card.key === key);
      return match ?? { key, label: KPI_CONFIG[key]?.label ?? key, value: 0, tone: 'blue', filter: key };
    });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const config = KPI_CONFIG[card.key] ?? KPI_CONFIG.active;
        const Icon = config.icon;

        return (
          <button
            key={card.key}
            type="button"
            className={`ptw-kpi group overflow-hidden ${config.lightTone} ${config.darkTone}`}
            onClick={() => onFilter(card.filter)}
          >
            {loading ? (
              <div className="h-16 animate-pulse rounded-lg bg-slate-200/50 dark:bg-white/5" />
            ) : (
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {card.label}
                  </span>
                  <span className={`rounded-md border p-1 shadow-xs transition-transform group-hover:scale-105 ${config.lightBadge} ${config.darkBadge}`}>
                    <Icon size={14} />
                  </span>
                </div>
                <div className="mt-2">
                  <span className="block font-mono text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    {card.value}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-primary dark:text-sky-400 group-hover:underline">
                    View list →
                  </span>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
