'use client';

import { useEffect, useState } from 'react';
import { ActualConsequencePanel } from '../severity-risk/ActualConsequencePanel';
import { ActualVsPotentialComparisonPanel } from '../severity-risk/ActualVsPotentialComparisonPanel';
import { HighPotentialNearMissPanel } from '../severity-risk/HighPotentialNearMissPanel';
import { InvestigationLevelRulesPanel } from '../severity-risk/InvestigationLevelRulesPanel';
import { InvestigationPriorityDecisionPanel } from '../severity-risk/InvestigationPriorityDecisionPanel';
import { LikelihoodProbabilityPanel } from '../severity-risk/LikelihoodProbabilityPanel';
import { PotentialConsequencePanel } from '../severity-risk/PotentialConsequencePanel';
import { PotentialSeverityHeader } from '../severity-risk/PotentialSeverityHeader';
import { RecalculateRiskDialog } from '../severity-risk/RecalculateRiskDialog';
import { RequestSeverityReviewDialog } from '../severity-risk/RequestSeverityReviewDialog';
import { ApproveSeverityDialog } from '../severity-risk/ApproveSeverityDialog';
import { RejectSeverityDialog } from '../severity-risk/RejectSeverityDialog';
import { RiskMatrixConfigurationSnapshotPanel } from '../severity-risk/RiskMatrixConfigurationSnapshotPanel';
import { RiskMatrixPanel } from '../severity-risk/RiskMatrixPanel';
import { SeverityChangeHistoryPanel } from '../severity-risk/SeverityChangeHistoryPanel';
import { SeverityReadinessPanel } from '../severity-risk/SeverityReadinessPanel';
import { SeverityReviewApprovalPanel } from '../severity-risk/SeverityReviewApprovalPanel';
import { SeveritySummaryCards } from '../severity-risk/SeveritySummaryCards';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';
import { useIncidentPotentialSeverity, useIncidentPotentialSeverityMutations } from '../../hooks/useIncidentPotentialSeverity';

export function PotentialSeverityRiskMatrixTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentPotentialSeverity(incidentId);
  const mutations = useIncidentPotentialSeverityMutations(incidentId);
  const [form, setForm] = useState<Record<string, any>>({});
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [recalculateDialogOpen, setRecalculateDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  useEffect(() => {
    if (!data || data.restricted) return;
    setForm({
      actualSeverity: data.actualConsequence?.severity ?? '',
      actualConsequenceCategory: data.actualConsequence?.consequenceCategory ?? '',
      actualInjurySeverity: data.actualConsequence?.injurySeverity ?? '',
      actualEnvironmentalImpact: data.actualConsequence?.environmentalImpact ?? '',
      actualAssetDamage: data.actualConsequence?.assetDamage ?? '',
      actualProductionImpact: data.actualConsequence?.productionImpact ?? '',
      actualFinancialImpact: data.actualConsequence?.financialImpact ?? '',
      actualConsequenceNotes: data.actualConsequence?.notes ?? '',
      actualConsequence: data.actualConsequence?.actualConsequence ?? '',
      potentialSeverity: data.potentialConsequence?.severity ?? '',
      potentialConsequenceCategory: data.potentialConsequence?.consequenceCategory ?? '',
      potentialInjurySeverity: data.potentialConsequence?.potentialInjurySeverity ?? '',
      potentialEnvironmentalImpact: data.potentialConsequence?.potentialEnvironmentalImpact ?? '',
      potentialAssetDamage: data.potentialConsequence?.potentialAssetDamage ?? '',
      potentialProcessSafetyConsequence: data.potentialConsequence?.potentialProcessSafetyConsequence ?? '',
      potentialSeverityBasis: data.potentialConsequence?.basis ?? '',
      potentialConsequence: data.potentialConsequence?.potentialConsequence ?? '',
      likelihood: data.likelihood?.likelihood ?? '',
      likelihoodBasis: data.likelihood?.basis ?? '',
      probabilityBasis: data.likelihood?.probabilityBasis ?? '',
      exposureFrequency: data.likelihood?.exposureFrequency ?? '',
      controlsPresent: data.likelihood?.controlsPresent ?? '',
      highPotentialNearMiss: !!data.highPotentialNearMiss?.highPotentialNearMiss,
      fatalityPotential: !!data.highPotentialNearMiss?.fatalityPotential,
      majorProcessSafetyPotential: !!data.highPotentialNearMiss?.majorProcessSafetyPotential
    });
  }, [data]);

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const saving = mutations.save.isPending || mutations.recalculate.isPending || mutations.requestReview.isPending || mutations.approve.isPending || mutations.reject.isPending;
  const action = (key: string) => data?.actions?.find((item: any) => item.key === key);

  if (isLoading) return <TabStatePanel title="Loading Potential Severity / Risk Matrix" message="Loading backend severity, risk matrix, readiness, and review state." />;
  if (error) return <TabStatePanel title="Could not load Potential Severity / Risk Matrix" message={error instanceof Error ? error.message : 'The tab API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No severity data" message="No severity/risk data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view this incident.'} tone="danger" />;

  const save = async () => {
    setMessage(null);
    try {
      await mutations.save.mutateAsync({ ...form, reason: reason || 'Potential Severity / Risk Matrix tab saved' });
      setMessage('Severity and risk data saved.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };

  const recalculate = async () => {
    setMessage(null);
    try {
      await mutations.recalculate.mutateAsync();
      setMessage('Risk recalculated from backend data.');
      setRecalculateDialogOpen(false);
    } catch (event) {
      setMessage(errorText(event));
    }
  };

  const requestReview = async () => {
    setMessage(null);
    try {
      await mutations.requestReview.mutateAsync({ reason: reason || 'Severity review requested from Risk Matrix tab' });
      setMessage('Severity review requested.');
      setReviewDialogOpen(false);
    } catch (event) {
      setMessage(errorText(event));
    }
  };

  const approveReview = async () => {
    setMessage(null);
    try {
      await mutations.approve.mutateAsync({ reason: reason || 'Severity review approved' });
      setMessage('Severity review approved.');
      setApproveDialogOpen(false);
    } catch (event) {
      setMessage(errorText(event));
    }
  };

  const rejectReview = async () => {
    setMessage(null);
    try {
      await mutations.reject.mutateAsync({ reason });
      setMessage('Severity review rejected.');
      setRejectDialogOpen(false);
    } catch (event) {
      setMessage(errorText(event));
    }
  };

  const severityOptions = data.riskMatrix?.severities ?? [];
  const likelihoodOptions = data.riskMatrix?.likelihoods ?? [];

  return (
    <div className="grid gap-4">
      <PotentialSeverityHeader
        data={data}
        saving={saving}
        action={action}
        message={message}
        onRecalculate={() => setRecalculateDialogOpen(true)}
        onRequestReview={() => setReviewDialogOpen(true)}
        onSave={save}
        onRefresh={() => refetch()}
      />
      <SeveritySummaryCards cards={data.summaryCards ?? []} />
      {data.riskMatrix?.configured ? null : (
        <section className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-100">
          <b>Missing risk matrix config.</b>
          <p className="mt-1">{data.riskMatrix?.missingReason ?? 'Risk score will remain Not Determined and severity review is required.'}</p>
          <p className="mt-1 text-xs">Admin action: Configure company/site incident risk matrix. This does not block continuing unless site policy requires it.</p>
        </section>
      )}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
        <ActualVsPotentialComparisonPanel comparison={data.comparison} />
        <InvestigationPriorityDecisionPanel data={data.investigationPriorityDecision} />
        <SeverityReadinessPanel readiness={data.readiness} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ActualConsequencePanel form={form} set={set} severityOptions={severityOptions} />
        <PotentialConsequencePanel form={form} set={set} severityOptions={severityOptions} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <LikelihoodProbabilityPanel form={form} set={set} likelihoodOptions={likelihoodOptions} />
        <RiskMatrixPanel data={data.riskMatrix} />
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        <InvestigationLevelRulesPanel data={data.investigationLevelRules} />
        <HighPotentialNearMissPanel data={data.highPotentialNearMiss} />
        <SeverityReviewApprovalPanel data={data.severityReview} permissions={data.permissions} reason={reason} setReason={setReason} saving={saving} onApprove={() => setApproveDialogOpen(true)} onReject={() => setRejectDialogOpen(true)} />
        <RiskMatrixConfigurationSnapshotPanel data={data.riskMatrixConfiguration} />
      </div>
      <SeverityChangeHistoryPanel rows={data.severityChangeHistory ?? []} />
      <RequestSeverityReviewDialog open={reviewDialogOpen} reason={reason} setReason={setReason} saving={saving} onCancel={() => setReviewDialogOpen(false)} onConfirm={requestReview} />
      <RecalculateRiskDialog open={recalculateDialogOpen} saving={saving} onCancel={() => setRecalculateDialogOpen(false)} onConfirm={recalculate} />
      <ApproveSeverityDialog open={approveDialogOpen} reason={reason} setReason={setReason} saving={saving} onCancel={() => setApproveDialogOpen(false)} onConfirm={approveReview} />
      <RejectSeverityDialog open={rejectDialogOpen} reason={reason} setReason={setReason} saving={saving} onCancel={() => setRejectDialogOpen(false)} onConfirm={rejectReview} />
    </div>
  );
}
