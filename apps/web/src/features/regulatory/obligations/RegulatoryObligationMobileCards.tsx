import Link from 'next/link';
import type { RegulatoryObligation } from '../types/regulatory-obligation.types';
import { RegulatoryCriticalityBadge } from '../shared/RegulatoryCriticalityBadge';
import { RegulatoryObligationApplicabilityBadge, RegulatoryObligationEvidenceBadge, RegulatoryObligationStatusBadge } from '../shared/RegulatoryObligationBadges';

export function RegulatoryObligationMobileCards({ rows }: { rows: RegulatoryObligation[] }) {
  return (
    <div className="grid gap-3 p-3 xl:hidden">
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">{row.obligation_code ?? 'No Code'}</p>
              <Link href={`/regulatory/obligations/${row.id}`} className="mt-1 block text-base font-semibold text-[var(--psm-fg)]">
                {row.obligation_title ?? 'Untitled obligation'}
              </Link>
            </div>
            <RegulatoryObligationStatusBadge value={row.obligation_status_calculated ?? row.obligation_status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <RegulatoryCriticalityBadge criticality={row.criticality} />
            <RegulatoryObligationApplicabilityBadge value={row.applicability_status} />
            <RegulatoryObligationEvidenceBadge value={row.evidence_expectation_status} />
          </div>
          <p className="mt-3 text-sm text-[var(--psm-muted)]">{row.parent_requirement_label ?? 'Parent requirement unavailable'}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--psm-muted)]">
            <div><dt className="font-semibold text-[var(--psm-fg)]">Owner</dt><dd>{row.owner?.displayName ?? row.owner_label ?? 'Unassigned'}</dd></div>
            <div><dt className="font-semibold text-[var(--psm-fg)]">Due</dt><dd>{formatDate(row.next_due_date ?? row.due_date)}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return 'Not Set';
  return new Date(value).toLocaleDateString();
}
