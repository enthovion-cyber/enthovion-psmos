'use client';

import { useState } from 'react';
import { useImpairmentDetail } from '../hooks/useImpairmentDetail';
import { useImpairmentMutations } from '../hooks/useImpairmentMutations';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { ActionButton, SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { ExtensionRequestDialog } from './ExtensionRequestDialog';
import { ImpairmentDetailHeader } from './ImpairmentDetailHeader';
import { ImpairmentDetailPanels } from './ImpairmentDetailPanels';
import { ImpairmentHistoryPanel } from './ImpairmentHistoryPanel';
import { ImpairmentReadinessPanel } from './ImpairmentReadinessPanel';
import { RestoreImpairmentForm } from './RestoreImpairmentForm';

export function ImpairmentDetailPage({ impairmentId }: { impairmentId: string }) {
  const [mode, setMode] = useState<string | null>(null);
  const query = useImpairmentDetail(impairmentId);
  const mutations = useImpairmentMutations(impairmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={5} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load this bypass / impairment record.</div>;
  const data = query.data;
  const busy = Object.values(mutations).some((mutation: any) => mutation.isPending);
  const action = (name: string) => {
    if (name === 'submit') mutations.submit.mutate({});
    else if (name === 'approve') mutations.approve.mutate({});
    else if (name === 'activate') mutations.activate.mutate({});
    else if (name === 'close') mutations.close.mutate({});
    else setMode(name);
  };
  return (
    <div className="space-y-5">
      {data.readOnly ? <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">{data.readOnlyReason}</div> : null}
      <ImpairmentDetailHeader impairment={data.impairment} busy={busy} onAction={action} />
      <ImpairmentReadinessPanel readiness={data.readiness} />
      {mode === 'extension' ? <ExtensionRequestDialog saving={mutations.requestExtension.isPending} onSubmit={(input) => mutations.requestExtension.mutate(input, { onSuccess: () => setMode(null) })} /> : null}
      {mode === 'restore' ? <RestoreImpairmentForm saving={mutations.restore.isPending} onSubmit={(input) => mutations.restore.mutate(input, { onSuccess: () => setMode(null) })} /> : null}
      <ImpairmentDetailPanels impairment={data.impairment} linkedRecords={data.linkedRecords} />
      <SectionCard title="Verification / Closure Actions" description="Verify restoration, reject verification, or close after verified restoration.">
        <div className="flex flex-wrap gap-2">
          <ActionButton disabled={busy || data.impairment.status !== 'Pending Restoration'} title="Record must be pending restoration." onClick={() => mutations.verifyRestoration.mutate({ result: 'Verified', comment: 'Verified from detail action.' })}>Verify Restoration</ActionButton>
          <ActionButton disabled={busy || data.impairment.status !== 'Pending Restoration'} title="Record must be pending restoration." onClick={() => mutations.verifyRestoration.mutate({ result: 'Rejected', comment: 'Restoration verification rejected.' })}>Reject Verification</ActionButton>
          <ActionButton disabled={busy || data.impairment.status !== 'Restoration Verified'} title="Restoration must be verified." onClick={() => mutations.close.mutate({ reason: 'Closed from detail action.' })}>Close Record</ActionButton>
        </div>
      </SectionCard>
      <ImpairmentHistoryPanel history={data.history} />
    </div>
  );
}
