'use client';
import { useQuery } from '@tanstack/react-query';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryApplicabilityProfileStatusBadge } from '../shared/RegulatoryApplicabilityProfileStatusBadge';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { regulatoryApplicabilityProfileService } from '../services/regulatory-applicability-profile.service';
import { RegulatoryApplicabilityCriteriaBuilder } from './RegulatoryApplicabilityCriteriaBuilder';
import { RegulatoryApplicabilityProfileForm } from './RegulatoryApplicabilityProfileForm';

export function RegulatoryApplicabilityProfileDetailPage({ profileId, edit = false }: { profileId: string; edit?: boolean }) {
  const query = useQuery({ queryKey: ['regulatory', 'applicability', 'profile', profileId], queryFn: () => regulatoryApplicabilityProfileService.detail(profileId), refetchOnWindowFocus: false });
  if (query.isLoading) return <RegulatoryLayout current="Applicability Profile"><RegulatoryLoadingState /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Applicability Profile"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const profile = query.data?.profile ?? query.data;
  if (edit) return <RegulatoryLayout current="Edit Applicability Profile"><RegulatoryHeader title="Edit Applicability Profile" subtitle={profile?.profile_name} /><RegulatoryApplicabilityProfileForm initial={profile} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Applicability Profile">
      <div className="space-y-5">
        <RegulatoryHeader title={profile?.profile_name ?? 'Applicability Profile'} subtitle={profile?.profile_type} action={<RegulatoryButton href={`/regulatory/applicability/profiles/${profileId}/edit`} variant="secondary">Edit</RegulatoryButton>} />
        <RegulatoryCard title="Profile Overview"><div className="grid gap-4 md:grid-cols-3"><div><p className="text-xs text-[var(--psm-muted)]">Status</p><RegulatoryApplicabilityProfileStatusBadge status={profile?.profile_status} /></div><div><p className="text-xs text-[var(--psm-muted)]">Category</p><p>{profile?.category ?? '-'}</p></div><div><p className="text-xs text-[var(--psm-muted)]">Criticality</p><p>{profile?.criticality ?? '-'}</p></div><div className="md:col-span-3"><p className="text-xs text-[var(--psm-muted)]">Description</p><p>{profile?.profile_description ?? '-'}</p></div></div></RegulatoryCard>
        <RegulatoryApplicabilityCriteriaBuilder criteria={query.data?.criteria} />
      </div>
    </RegulatoryLayout>
  );
}
