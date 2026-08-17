import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { MiDetailTabKey } from '../types/equipment-detail.types';
import type { MiEquipmentStatusItem } from '../types/equipment.types';

const toneClass: Record<string, string> = {
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  warning: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200',
  danger: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-200',
  neutral: 'border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-text)]'
};

export function EquipmentStatusSummaryBar({ items, onNavigate }: { items: MiEquipmentStatusItem[]; onNavigate: (tab: MiDetailTabKey) => void }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            title={item.reason ?? `Open ${item.tab.replace(/-/g, ' ')}`}
            onClick={() => onNavigate(item.tab as MiDetailTabKey)}
            className={`min-h-[76px] rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${toneClass[item.tone] ?? toneClass.neutral}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{item.label}</span>
              {item.tone === 'danger' ? <AlertTriangle size={15} /> : item.tone === 'success' ? <CheckCircle2 size={15} /> : <Info size={15} />}
            </div>
            <div className="mt-2 text-sm font-bold">{item.value}</div>
            {item.reason ? <div className="mt-1 line-clamp-2 text-xs opacity-80">{item.reason}</div> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
