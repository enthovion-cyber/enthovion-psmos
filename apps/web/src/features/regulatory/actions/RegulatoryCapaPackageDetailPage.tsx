'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCapaPackageStatusBadge } from '../shared/RegulatoryCapaPackageStatusBadge';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryCapaPackageDetail } from '../hooks/useRegulatoryCapaPackageDetail';
import { CapaPackageTable, RegulatoryActionTable, ReadinessPanel, formatDate, valueText } from './components/RegulatoryActionUi';

const tabs = ['overview', 'sources', 'actions', 'evidence', 'verification', 'effectiveness', 'closure-readiness', 'history'];

export function RegulatoryCapaPackageDetailPage({ capaPackageId, tab = 'overview' }: { capaPackageId: string; tab?: string }) {
  const [active, setActive] = useState(tab);
  const query = useRegulatoryCapaPackageDetail(capaPackageId);
  if (query.isLoading) return <RegulatoryLayout current="CAPA Package"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="CAPA Package"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const pkg = query.data?.package;
  if (!pkg) return <RegulatoryLayout current="CAPA Package"><RegulatoryErrorState message="CAPA package was not found or is outside your scope." /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="CAPA Package">
      <div className="space-y-5">
        <RegulatoryHeader title={pkg.capa_package_title ?? 'Regulatory CAPA package'} subtitle={`${pkg.capa_package_code ?? pkg.id} · ${pkg.capa_package_type ?? 'CAPA package'}`} action={<><RegulatoryButton variant="secondary" onClick={() => query.refetch()}>Refresh</RegulatoryButton><RegulatoryButton href="/regulatory/actions/capa" variant="secondary">Back to Packages</RegulatoryButton></>} />
        <div className="flex flex-wrap gap-2"><RegulatoryCapaPackageStatusBadge value={pkg.package_status} /></div>
        <nav className="flex gap-2 overflow-x-auto">{tabs.map((item) => <button key={item} type="button" onClick={() => setActive(item)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${active === item ? 'bg-primary text-white' : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>{item.replace(/-/g, ' ')}</button>)}</nav>
        {active === 'overview' ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <RegulatoryCard title="Package Overview">
              <dl className="grid gap-3 text-sm">
                <div><dt className="text-[var(--psm-muted)]">Owner</dt><dd className="font-semibold text-[var(--psm-fg)]">{valueText(pkg.owner_user_id)}</dd></div>
                <div><dt className="text-[var(--psm-muted)]">Due</dt><dd className="font-semibold text-[var(--psm-fg)]">{formatDate(pkg.due_date)}</dd></div>
                <div><dt className="text-[var(--psm-muted)]">Criticality</dt><dd className="font-semibold text-[var(--psm-fg)]">{valueText(pkg.criticality)}</dd></div>
              </dl>
            </RegulatoryCard>
            <ReadinessPanel readiness={{ status: pkg.closure_readiness_status }} />
          </div>
        ) : active === 'actions' ? <RegulatoryActionTable rows={pkg.actions} /> : active === 'sources' ? <CapaPackageTable rows={[pkg]} /> : <RegulatoryCard title={active.replace(/-/g, ' ')}><pre className="max-h-[520px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(pkg, null, 2)}</pre></RegulatoryCard>}
      </div>
    </RegulatoryLayout>
  );
}
