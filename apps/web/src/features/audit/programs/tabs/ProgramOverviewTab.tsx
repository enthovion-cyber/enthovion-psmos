import type { AuditDetail } from '../../types/audit.types';
import { AuditCard } from '../../shared/AuditUi';

export function ProgramOverviewTab({ detail }: { detail: AuditDetail }) {
  return <div className="grid gap-4 xl:grid-cols-3">{detail.overview.map((card) => <AuditCard key={card.label}><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{card.label}</p><p className="mt-2 text-lg font-semibold">{String(card.value)}</p></AuditCard>)}</div>;
}
