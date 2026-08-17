'use client';
import Link from 'next/link';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryApplicabilityProfileStatusBadge } from '../shared/RegulatoryApplicabilityProfileStatusBadge';
import { RegulatoryButton, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryApplicabilityProfiles } from '../hooks/useRegulatoryApplicabilityProfiles';

export function RegulatoryApplicabilityProfileRegisterPage() {
  const query = useRegulatoryApplicabilityProfiles();
  return <RegulatoryLayout current="Applicability Profiles"><div className="space-y-5"><RegulatoryHeader title="Applicability Profiles" subtitle="Reusable criteria profiles for guided applicability assessments." action={<RegulatoryButton href="/regulatory/applicability/profiles/new">New Profile</RegulatoryButton>} />{query.isLoading ? <RegulatoryLoadingState /> : query.isError ? <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /> : !query.data?.rows?.length ? <RegulatoryEmptyState title="No applicability profiles" message="Create profiles only from verified company/site criteria. No defaults are fabricated." /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{query.data.rows.map((row) => <Link href={`/regulatory/applicability/profiles/${row.id}`} key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="flex justify-between gap-3"><h3 className="font-semibold">{row.profile_name}</h3><RegulatoryApplicabilityProfileStatusBadge status={row.profile_status} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{row.profile_description ?? row.profile_type}</p></Link>)}</div>}</div></RegulatoryLayout>;
}
