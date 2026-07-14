'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ApprovalImpactPanel } from '../risk/ApprovalImpactPanel';
import { BeforeAfterRiskComparison } from '../risk/BeforeAfterRiskComparison';
import { RequiredSafetyReviewsPanel } from '../risk/RequiredSafetyReviewsPanel';
import { RiskActionBar } from '../risk/RiskActionBar';
import { RiskHistoryTable } from '../risk/RiskHistoryTable';
import { RiskImpactScoreForm } from '../risk/RiskImpactScoreForm';
import { RiskLevelExplanation } from '../risk/RiskLevelExplanation';
import { RiskRationaleForm } from '../risk/RiskRationaleForm';
import { RiskSummaryCard } from '../risk/RiskSummaryCard';
import { ErrorState, LoadingState } from '../moc-detail-ui';
import { useMOCRisk } from '../../hooks/useMOCRisk';
import { useMOCRiskMutations } from '../../hooks/useMOCRiskMutations';
import { mocRiskSchema, valuesFromRisk, type MOCRiskValues } from '../../schemas/moc-risk.schema';

export function MOCRiskRankingTab({ moc }: { moc: any }) {
  const riskQuery = useMOCRisk(moc.id);
  const mutations = useMOCRiskMutations(moc.id);
  const form = useForm<MOCRiskValues>({ resolver: zodResolver(mocRiskSchema), defaultValues: valuesFromRisk(moc.risk) });
  const risk = riskQuery.data?.risk ?? moc.risk;
  const history = riskQuery.data?.history ?? [];
  const reviewRequirements = riskQuery.data?.reviewRequirements ?? [];
  const readOnly = Boolean(riskQuery.data?.readOnly);
  const isLocked = Boolean(risk?.locked_at || risk?.status === 'Locked');

  useEffect(() => {
    if (risk) form.reset(valuesFromRisk(risk));
  }, [form, risk]);

  const values = form.getValues;
  const onSave = form.handleSubmit((payload) => mutations.save.mutate(payload));
  const onRecalculate = () => mutations.recalculate.mutate(values());
  const onComplete = form.handleSubmit(() => mutations.complete.mutate());
  const onRequestReassessment = () => {
    const reason = window.prompt('Reason for risk reassessment?', 'Risk ranking requires reassessment based on latest MOC information.');
    if (reason) mutations.requestReassessment.mutate(reason);
  };

  if (riskQuery.isLoading) return <LoadingState />;
  if (riskQuery.isError) return <ErrorState message="Unable to load MOC risk ranking from API." />;

  return (
    <form onSubmit={onSave} className="space-y-4">
      <RiskSummaryCard risk={risk} summary={riskQuery.data?.summary} readOnly={readOnly} />
      <div className="grid gap-4 2xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <RiskImpactScoreForm register={form.register} watch={form.watch} errors={form.formState.errors} disabled={readOnly} />
          <RiskRationaleForm register={form.register} errors={form.formState.errors} disabled={readOnly} />
          <BeforeAfterRiskComparison watch={form.watch} risk={risk} />
          <RiskHistoryTable history={history} />
        </div>
        <aside className="space-y-4">
          <RiskLevelExplanation />
          <ApprovalImpactPanel risk={risk} />
          <RequiredSafetyReviewsPanel requirements={reviewRequirements} onApply={() => mutations.applyReviewRequirements.mutate()} applying={mutations.applyReviewRequirements.isPending} />
        </aside>
      </div>
      <RiskActionBar
        readOnly={readOnly}
        isLocked={isLocked}
        saving={mutations.save.isPending}
        recalculating={mutations.recalculate.isPending}
        completing={mutations.complete.isPending}
        locking={mutations.lock.isPending}
        unlocking={mutations.unlock.isPending}
        onSave={onSave}
        onRecalculate={onRecalculate}
        onComplete={onComplete}
        onLock={() => mutations.lock.mutate()}
        onUnlock={() => mutations.unlock.mutate()}
        onRequestReassessment={onRequestReassessment}
      />
    </form>
  );
}
