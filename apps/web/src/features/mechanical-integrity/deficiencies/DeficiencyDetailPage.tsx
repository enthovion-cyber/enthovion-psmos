'use client';

import { useRouter } from 'next/navigation';
import { useDeficiencyDetail, useDeficiencyMutations } from '../hooks/useDeficiencies';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { DeficiencyDetailHeader } from './DeficiencyDetailHeader';
import { CorrectiveLinksPanel, DeficiencyHistoryPanel, DeficiencyOverviewPanel, DeficiencyReadinessPanel, TemporaryControlsPanel } from './DeficiencyDetailPanels';
import { DeficiencyVerificationForm } from './DeficiencyVerificationForm';

export function DeficiencyDetailPage({ deficiencyId, mode }: { deficiencyId: string; mode?: 'review' | 'verify' | undefined }) {
  const router = useRouter();
  const query = useDeficiencyDetail(deficiencyId);
  const mutations = useDeficiencyMutations(deficiencyId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load deficiency detail.</div>;
  const busy = Object.values(mutations).some((mutation: any) => mutation.isPending);
  return (
    <div className="space-y-5">
      <DeficiencyDetailHeader
        detail={query.data}
        busy={busy}
        onSubmit={() => void mutations.submit.mutateAsync({}).then(() => query.refetch())}
        onReview={() => void mutations.review.mutateAsync({}).then(() => query.refetch())}
        onApprove={() => void mutations.approve.mutateAsync({}).then(() => query.refetch())}
        onReject={() => {
          const reason = window.prompt('Rejection reason');
          if (reason) void mutations.reject.mutateAsync({ reason }).then(() => query.refetch());
        }}
        onClose={() => void mutations.close.mutateAsync({ override: false }).then(() => query.refetch()).catch((error) => window.alert(error?.message ?? 'Close blocked by readiness rules.'))}
      />
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <DeficiencyOverviewPanel detail={query.data} />
          <TemporaryControlsPanel detail={query.data} />
          {mode === 'verify' ? <DeficiencyVerificationForm deficiencyId={deficiencyId} /> : null}
        </div>
        <div className="space-y-5">
          <DeficiencyReadinessPanel detail={query.data} />
          <CorrectiveLinksPanel detail={query.data} />
          <DeficiencyHistoryPanel detail={query.data} />
        </div>
      </div>
      {mode === 'review' ? <button type="button" onClick={() => router.push(`/mechanical-integrity/deficiencies/${deficiencyId}`)} className="text-sm text-primary">Back to detail</button> : null}
    </div>
  );
}
