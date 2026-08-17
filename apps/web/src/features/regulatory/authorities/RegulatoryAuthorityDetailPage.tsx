'use client';
import { useQuery } from '@tanstack/react-query';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryAuthorityStatusBadge } from '../shared/RegulatoryAuthorityStatusBadge';
import { RegulatoryAuthorityTypeBadge } from '../shared/RegulatoryAuthorityTypeBadge';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { regulatoryAuthorityService } from '../services/regulatory-authority.service';
import { RegulatoryAuthorityForm } from './RegulatoryAuthorityForm';

export function RegulatoryAuthorityDetailPage({ authorityId, edit = false, section = 'overview' }: { authorityId: string; edit?: boolean; section?: string }) {
  const query = useQuery({ queryKey: ['regulatory', 'authority', authorityId], queryFn: () => regulatoryAuthorityService.detail(authorityId), refetchOnWindowFocus: false });
  if (query.isLoading) return <RegulatoryLayout current="Authority"><RegulatoryLoadingState /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Authority"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const row = query.data;
  if (edit) return <RegulatoryLayout current="Edit Authority"><RegulatoryHeader title="Edit Authority" subtitle={row?.authority_name ?? authorityId} /><RegulatoryAuthorityForm initial={row} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Authority">
      <div className="space-y-5">
        <RegulatoryHeader title={row?.authority_name ?? 'Authority'} subtitle={`${row?.authority_code ?? authorityId} / ${section}`} action={<RegulatoryButton href={`/regulatory/authorities/${authorityId}/edit`} variant="secondary">Edit</RegulatoryButton>} />
        <RegulatoryCard title="Authority Overview" subtitle="Authority metadata is read from the backend and remains tenant/site isolated.">
          <div className="grid gap-4 md:grid-cols-3">
              <div><p className="text-xs text-[var(--psm-muted)]">Type</p><RegulatoryAuthorityTypeBadge type={row?.authority_type} /></div>
              <div><p className="text-xs text-[var(--psm-muted)]">Status</p><RegulatoryAuthorityStatusBadge status={row?.authority_status} /></div>
              <div><p className="text-xs text-[var(--psm-muted)]">Jurisdiction Level</p><p className="font-semibold">{row?.jurisdiction_level ?? '-'}</p></div>
              <div><p className="text-xs text-[var(--psm-muted)]">Country</p><p>{row?.country ?? '-'}</p></div>
              <div><p className="text-xs text-[var(--psm-muted)]">Inspection Authority</p><p>{row?.inspection_authority ? 'Yes' : 'No'}</p></div>
              <div><p className="text-xs text-[var(--psm-muted)]">Permit Authority</p><p>{row?.permit_authority ? 'Yes' : 'No'}</p></div>
              <div><p className="text-xs text-[var(--psm-muted)]">Enforcement Authority</p><p>{row?.enforcement_authority ? 'Yes' : 'No'}</p></div>
              <div className="md:col-span-2"><p className="text-xs text-[var(--psm-muted)]">Notes</p><p>{row?.notes ?? '-'}</p></div>
          </div>
        </RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}
