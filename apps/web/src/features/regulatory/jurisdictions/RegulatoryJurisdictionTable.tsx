import Link from 'next/link';
import { RegulatoryJurisdictionLevelBadge } from '../shared/RegulatoryJurisdictionLevelBadge';
import { RegulatoryBadge, RegulatoryEmptyState } from '../shared/RegulatoryUi';

export function RegulatoryJurisdictionTable({ rows }: { rows?: Array<Record<string, any>> | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No jurisdictions found" message="Create or link jurisdiction records from the register. No placeholder jurisdictions are shown." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
      <table className="min-w-[980px] w-full text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]">
          <tr><th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">Level</th><th className="p-3">Country</th><th className="p-3">State</th><th className="p-3">City</th><th className="p-3">Industrial Zone</th><th className="p-3">Authority</th><th className="p-3">Owner</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--psm-line)]">
              <td className="p-3 font-mono text-xs">{row.jurisdiction_code ?? '-'}</td>
              <td className="p-3 font-semibold text-[var(--psm-fg)]">{row.jurisdiction_name}</td>
              <td className="p-3"><RegulatoryJurisdictionLevelBadge level={row.jurisdiction_level} /></td>
              <td className="p-3">{row.country ?? '-'}</td><td className="p-3">{row.state_province ?? '-'}</td><td className="p-3">{row.city_municipality ?? '-'}</td><td className="p-3">{row.industrial_zone ?? '-'}</td><td className="p-3">{row.authority_name ?? '-'}</td><td className="p-3">{row.owner_user_id ?? '-'}</td><td className="p-3"><RegulatoryBadge tone={row.jurisdiction_status === 'Active' ? 'good' : 'warn'}>{row.jurisdiction_status}</RegulatoryBadge></td>
              <td className="p-3"><Link className="font-semibold text-primary" href={`/regulatory/jurisdictions/${row.id}`}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
