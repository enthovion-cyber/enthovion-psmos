'use client';

import { usePsiWaivers } from '../hooks/usePsiWaivers';
import { WaiverStatusBadge } from '../components/shared/WaiverStatusBadge';
import { PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiCompletenessHeader } from './PsiCompletenessHeader';

export function PsiWaiverRegistryPage() {
  const waivers = usePsiWaivers();
  if (waivers.isLoading) return <PsiLoadingState rows={4} />;
  if (waivers.isError) return <PsiErrorState message="Completeness waivers could not be loaded." onRetry={() => waivers.refetch()} />;
  return <div className="space-y-5"><PsiCompletenessHeader title="PSI Completeness Waivers" subtitle="Temporary exception workflow with approval, rejection, revocation, expiry, and compensating controls." /><PsiCard title="Waiver Register"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-xs uppercase text-[var(--psm-muted)]"><tr><th className="py-2">Gap</th><th className="py-2">Reason</th><th className="py-2">Status</th><th className="py-2">Expires</th><th className="py-2">Requested By</th></tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{(waivers.data ?? []).map((waiver) => <tr key={waiver.id}><td className="py-3">{waiver.gap_id}</td><td className="py-3">{waiver.waiver_reason}</td><td className="py-3"><WaiverStatusBadge status={waiver.approval_status ?? waiver.waiver_status} /></td><td className="py-3">{waiver.expiry_date ?? 'No expiry'}</td><td className="py-3">{waiver.requested_by ?? '-'}</td></tr>)}</tbody></table></div></PsiCard></div>;
}
