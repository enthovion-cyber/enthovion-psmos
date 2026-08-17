import Link from 'next/link';
import { RegulatoryCard, RegulatoryEmptyState } from '../shared/RegulatoryUi';
import { RegulatoryEvidenceReadinessBadge } from '../shared/RegulatoryEvidenceReadinessBadge';
import { RegulatoryEvidenceReviewStatusBadge } from '../shared/RegulatoryEvidenceReviewStatusBadge';
import { RegulatoryEvidenceStatusBadge } from '../shared/RegulatoryEvidenceStatusBadge';
import { RegulatoryEvidenceTypeBadge } from '../shared/RegulatoryEvidenceTypeBadge';
import type { RegulatoryEvidenceLink } from '../types/regulatory-evidence.types';

export function RegulatoryEvidenceLinkTable({ rows }: { rows?: RegulatoryEvidenceLink[] | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No evidence links" message="No evidence links match the selected company/site scope and filters." />;
  return (
    <RegulatoryCard title="Evidence Link Register" subtitle="Controlled evidence references from Document Control, storage, audit evidence, module records, and approved external references.">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
          <thead className="text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]">
            <tr><th className="px-3 py-2">Evidence</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Source</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Review</th><th className="px-3 py-2">Readiness</th><th className="px-3 py-2">Expiry</th><th className="px-3 py-2">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((row) => <tr key={row.id} className="align-top">
              <td className="px-3 py-3"><Link className="font-semibold text-primary hover:underline" href={`/regulatory/evidence/links/${row.id}`}>{row.evidence_code ?? row.id}</Link><div className="text-[var(--psm-muted)]">{row.evidence_title}</div>{row.restricted ? <div className="mt-1 text-xs text-danger">Restricted{row.redacted ? ' / redacted' : ''}</div> : null}</td>
              <td className="px-3 py-3"><RegulatoryEvidenceTypeBadge type={row.evidence_type} /></td>
              <td className="px-3 py-3 text-[var(--psm-muted)]">{row.source_module ?? row.source_type ?? 'Regulatory Evidence'}<div>{row.source_record_id ?? row.document_id ?? row.storage_file_id ?? 'No source id'}</div></td>
              <td className="px-3 py-3"><RegulatoryEvidenceStatusBadge status={row.evidence_status} /></td>
              <td className="px-3 py-3"><RegulatoryEvidenceReviewStatusBadge status={row.review_status} /></td>
              <td className="px-3 py-3"><RegulatoryEvidenceReadinessBadge status={row.readiness_status} /></td>
              <td className="px-3 py-3 text-[var(--psm-muted)]">{formatDate(row.expiry_date)}</td>
              <td className="px-3 py-3"><Link className="text-primary hover:underline" href={`/regulatory/evidence/links/${row.id}/overview`}>View details</Link></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 lg:hidden">{rows.map((row) => <Link key={row.id} href={`/regulatory/evidence/links/${row.id}`} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="font-semibold text-primary">{row.evidence_code ?? row.id}</div><div className="text-sm text-[var(--psm-fg)]">{row.evidence_title}</div><div className="mt-2 flex flex-wrap gap-2"><RegulatoryEvidenceStatusBadge status={row.evidence_status} /><RegulatoryEvidenceReviewStatusBadge status={row.review_status} /><RegulatoryEvidenceReadinessBadge status={row.readiness_status} /></div></Link>)}</div>
    </RegulatoryCard>
  );
}

function formatDate(value?: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : 'Not set';
}
