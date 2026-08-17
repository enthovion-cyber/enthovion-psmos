'use client';
import { useCompetencyProfileDetail } from '../hooks/useCompetencyProfileDetail';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { ProfileDetailHeader } from './ProfileDetailHeader';
import { ProfileCompetencyRequirementsTab } from './tabs/ProfileCompetencyRequirementsTab';
import { ProfileEvaluationsTab } from './tabs/ProfileEvaluationsTab';
import { ProfileMatrixSyncTab } from './tabs/ProfileMatrixSyncTab';
import { ProfileOverviewTab } from './tabs/ProfileOverviewTab';
import { ProfileRoleDutiesTab } from './tabs/ProfileRoleDutiesTab';
import { ProfileScopeTab } from './tabs/ProfileScopeTab';
import { ProfileVersionHistoryTab } from './tabs/ProfileVersionHistoryTab';
import { ProfileWorkersTab } from './tabs/ProfileWorkersTab';

export function ProfileDetailPage({ profileId, tab = 'overview' }: { profileId: string; tab?: string }) {
  const query = useCompetencyProfileDetail(profileId);
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const data = query.data ?? {};
  return <div className="space-y-5"><ProfileDetailHeader profile={data.profile ?? { id: profileId }} />{tab === 'scope' ? <ProfileScopeTab rows={data.scopes ?? []} /> : tab === 'role-duties' || tab === 'requirements' ? <><ProfileRoleDutiesTab rows={data.duties ?? []} /><ProfileCompetencyRequirementsTab rows={data.requirements ?? []} /></> : tab === 'workers' ? <ProfileWorkersTab rows={data.assignments ?? []} /> : tab === 'evaluations' ? <ProfileEvaluationsTab rows={data.evaluations ?? []} /> : tab === 'matrix-sync' ? <ProfileMatrixSyncTab profile={data.profile ?? {}} rows={data.matrixLinks ?? []} /> : tab === 'review-approval' ? <ProfileOverviewTab data={data} reviewOnly /> : tab === 'version-history' ? <ProfileVersionHistoryTab rows={data.versions ?? []} /> : <ProfileOverviewTab data={data} />}</div>;
}
