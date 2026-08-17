'use client';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState, RegulatoryButton } from '../shared/RegulatoryUi';
import { useRegulatoryJurisdictionDetail } from '../hooks/useRegulatoryJurisdictionDetail';
import { RegulatoryJurisdictionLevelBadge } from '../shared/RegulatoryJurisdictionLevelBadge';

export function RegulatoryJurisdictionDetailPage({ jurisdictionId, section = 'overview' }: { jurisdictionId: string; section?: string }) {
  const query = useRegulatoryJurisdictionDetail(jurisdictionId);
  if (query.isLoading) return <RegulatoryLayout current="Jurisdiction"><RegulatoryLoadingState /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Jurisdiction"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const row = query.data;
  return (
    <RegulatoryLayout current="Jurisdiction">
      <div className="space-y-5">
        <RegulatoryHeader title={row?.jurisdiction_name ?? 'Jurisdiction'} subtitle={`${row?.country ?? 'Scope not set'} / ${section}`} action={<RegulatoryButton href={`/regulatory/jurisdictions/${jurisdictionId}/edit`} variant="secondary">Edit</RegulatoryButton>} />
        <RegulatoryCard title="Jurisdiction Overview" subtitle="Authority, site links, register items, applicability and history remain backend-controlled.">
          <div className="grid gap-3 md:grid-cols-3">
            <div><p className="text-xs text-[var(--psm-muted)]">Code</p><p className="font-semibold">{row?.jurisdiction_code ?? '-'}</p></div>
            <div><p className="text-xs text-[var(--psm-muted)]">Level</p><RegulatoryJurisdictionLevelBadge level={row?.jurisdiction_level} /></div>
            <div><p className="text-xs text-[var(--psm-muted)]">Authority</p><p className="font-semibold">{row?.authority_name ?? '-'}</p></div>
            <div><p className="text-xs text-[var(--psm-muted)]">State</p><p>{row?.state_province ?? '-'}</p></div>
            <div><p className="text-xs text-[var(--psm-muted)]">City</p><p>{row?.city_municipality ?? '-'}</p></div>
            <div><p className="text-xs text-[var(--psm-muted)]">Industrial Zone</p><p>{row?.industrial_zone ?? '-'}</p></div>
          </div>
        </RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}
