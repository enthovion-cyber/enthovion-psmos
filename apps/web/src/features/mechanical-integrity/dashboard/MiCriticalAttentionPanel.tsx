import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import type { MiAttentionItem } from '../types/equipment.types';
import { MiEmptyState } from '../shared/MiEmptyState';

export function MiCriticalAttentionPanel({ items }: { items: MiAttentionItem[] }) {
  return (
    <section className="psm-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">Critical Attention</h2>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Critical assets, startup blockers, expired bypasses, and overdue safety-critical inspections.</p>
        </div>
        <AlertTriangle className="text-warning" size={20} />
      </div>
      {items.length === 0 ? <MiEmptyState title="No critical MI blockers" description="Backend did not find critical out-of-service, not-fit, startup-blocked, or expired bypass items." /> : (
        <div className="mt-4 divide-y divide-[var(--psm-line)]">
          {items.map((item) => (
            <div key={`${item.equipmentId}-${item.issueType}`} className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Link href={item.href} className="font-semibold text-primary hover:underline">{item.equipmentTag} - {item.equipmentName}</Link>
                <div className="mt-1 text-xs text-[var(--psm-muted)]">{[item.site, item.unit, item.area].filter(Boolean).join(' / ') || 'Location not configured'}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">{item.issueType}</span>
                <span className="rounded-full border border-danger/30 bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">{item.severity}</span>
                {item.dueDate ? <span className="text-xs text-[var(--psm-muted)]">{new Date(item.dueDate).toLocaleDateString()}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
