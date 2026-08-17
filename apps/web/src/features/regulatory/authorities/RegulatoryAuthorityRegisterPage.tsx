'use client';
import { useState } from 'react';
import Link from 'next/link';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryAuthorityStatusBadge } from '../shared/RegulatoryAuthorityStatusBadge';
import { RegulatoryAuthorityTypeBadge } from '../shared/RegulatoryAuthorityTypeBadge';
import { RegulatoryButton, RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryAuthorities } from '../hooks/useRegulatoryAuthorities';

export function RegulatoryAuthorityRegisterPage() {
  const [search, setSearch] = useState('');
  const query = useRegulatoryAuthorities({ search });
  return (
    <RegulatoryLayout current="Authorities">
      <div className="space-y-5">
        <RegulatoryHeader title="Authority / Regulator Register" subtitle="Government, corporate, industrial-zone, permit, inspection and enforcement authority foundation." action={<RegulatoryButton href="/regulatory/authorities/new">New Authority</RegulatoryButton>} />
        <RegulatoryCard title="Filters / Search"><input className={regulatoryInputClass()} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search authorities..." /></RegulatoryCard>
        {query.isLoading ? <RegulatoryLoadingState /> : query.isError ? <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /> : !query.data?.rows?.length ? <RegulatoryEmptyState title="No authorities found" message="No fake regulator records are shown. Add verified authorities from your company/site source data." /> : (
          <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
            <table className="min-w-[980px] w-full text-sm"><thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]"><tr><th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Level</th><th className="p-3">Country</th><th className="p-3">Inspection</th><th className="p-3">Permit</th><th className="p-3">Enforcement</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>
              {query.data.rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="p-3 font-mono text-xs">{row.authority_code ?? '-'}</td><td className="p-3 font-semibold">{row.authority_name}</td><td className="p-3"><RegulatoryAuthorityTypeBadge type={row.authority_type} /></td><td className="p-3">{row.jurisdiction_level ?? '-'}</td><td className="p-3">{row.country ?? '-'}</td><td className="p-3">{row.inspection_authority ? 'Yes' : 'No'}</td><td className="p-3">{row.permit_authority ? 'Yes' : 'No'}</td><td className="p-3">{row.enforcement_authority ? 'Yes' : 'No'}</td><td className="p-3"><RegulatoryAuthorityStatusBadge status={row.authority_status} /></td><td className="p-3"><Link className="font-semibold text-primary" href={`/regulatory/authorities/${row.id}`}>View</Link></td></tr>)}
            </tbody></table>
          </div>
        )}
      </div>
    </RegulatoryLayout>
  );
}
