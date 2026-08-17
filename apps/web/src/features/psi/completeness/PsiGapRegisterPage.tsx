'use client';

import type { PsiCompletenessGap } from '../types/psi-completeness.types';
import { usePsiGapMutations } from '../hooks/usePsiGapMutations';
import { usePsiGaps } from '../hooks/usePsiGaps';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiCompletenessHeader } from './PsiCompletenessHeader';
import { PsiGapLifecyclePanel } from './PsiGapLifecyclePanel';
import { PsiGapTable } from './PsiGapTable';
import { PsiMocRequiredPanel } from './PsiMocRequiredPanel';
import { PsiPssrBlockerPanel } from './PsiPssrBlockerPanel';

export function PsiGapRegisterPage({ mode, title = 'PSI Completeness Gaps' }: { mode?: 'critical' | 'pssr' | 'moc' | 'review' | 'document' | 'conflicts'; title?: string }) {
  const gaps = usePsiGaps({}, mode);
  const mutations = usePsiGapMutations();
  const rows = gaps.data?.rows ?? [];
  const reason = { reason: 'Updated from PSI completeness gap register.' };
  const createAction = (gap: PsiCompletenessGap) => mutations.createAction.mutate({ gapId: gap.id, input: { title: gap.gap_title, reason: gap.recommended_action ?? gap.reason } });
  if (gaps.isLoading) return <PsiLoadingState rows={5} />;
  if (gaps.isError) return <PsiErrorState message="The PSI gap register could not be loaded." onRetry={() => gaps.refetch()} />;
  return <div className="space-y-5"><PsiCompletenessHeader title={title} subtitle="Lifecycle-managed gap register with owner assignment, action creation, waiver, resolution, verification, reopen, PSSR blocker, and MOC-required views." /><PsiGapTable rows={rows} onCreateAction={createAction} onResolve={(gap) => mutations.markResolved.mutate({ gapId: gap.id, input: reason })} onVerify={(gap) => mutations.verifyGap.mutate({ gapId: gap.id, input: reason })} /><div className="grid gap-5 xl:grid-cols-2"><PsiPssrBlockerPanel rows={rows.filter((gap) => gap.pssr_blocker)} /><PsiMocRequiredPanel rows={rows.filter((gap) => gap.moc_required)} /></div><PsiGapLifecyclePanel /></div>;
}
