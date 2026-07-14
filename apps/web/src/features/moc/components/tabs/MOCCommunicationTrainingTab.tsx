'use client';

import { useEffect, useMemo, useState } from 'react';
import { AcknowledgementTracker } from '../communication/AcknowledgementTracker';
import { CommunicationLogTable } from '../communication/CommunicationLogTable';
import { CommunicationPlanPanel } from '../communication/CommunicationPlanPanel';
import { CommunicationTrainingSummaryCard } from '../communication/CommunicationTrainingSummaryCard';
import { StakeholdersPanel } from '../communication/StakeholdersPanel';
import { StartupTrainingBlockersPanel } from '../training/StartupTrainingBlockersPanel';
import { TrainingCompletionTracker } from '../training/TrainingCompletionTracker';
import { TrainingRequirementsPanel } from '../training/TrainingRequirementsPanel';
import { ErrorState, LoadingState } from '../moc-detail-ui';
import { useMOCCommunicationTraining } from '../../hooks/useMOCCommunicationTraining';
import { useMOCCommunicationTrainingMutations } from '../../hooks/useMOCCommunicationTrainingMutations';
import { mocCommunicationTrainingService } from '../../services/moc-communication-training.service';

export function MOCCommunicationTrainingTab({ moc }: { moc: any }) {
  const { data, isLoading, isError } = useMOCCommunicationTraining(moc.id);
  const mutations = useMOCCommunicationTrainingMutations(moc.id);
  const [stakeholder, setStakeholder] = useState({ stakeholderType: 'Operations', notes: '', acknowledgementRequired: true, requiredBeforeStartup: true });
  const [plan, setPlan] = useState({ objective: '', method: 'In-app notification', messageSummary: '', safetyPrecautions: '', effectiveDate: '', plannedDate: '' });
  const [training, setTraining] = useState({ title: '', trainingType: 'General awareness', roleName: '', requiredBeforeStartup: true, requiredBeforeClosure: false, evidenceRequired: true, verificationRequired: true });

  useEffect(() => {
    if (data?.plan) {
      setPlan({
        objective: data.plan.objective ?? '',
        method: data.plan.method ?? 'In-app notification',
        messageSummary: data.plan.message_summary ?? '',
        safetyPrecautions: data.plan.safety_precautions ?? '',
        effectiveDate: data.plan.effective_date ?? '',
        plannedDate: data.plan.planned_date ?? ''
      });
    }
  }, [data?.plan]);

  const assignments = useMemo(() => data?.assignments ?? [], [data?.assignments]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Unable to load MOC communication and training data." />;

  return (
    <div className="space-y-4">
      <CommunicationTrainingSummaryCard summary={data?.summary} />
      <div className="grid gap-4 2xl:grid-cols-[1fr_0.95fr]">
        <StakeholdersPanel rows={data?.stakeholders ?? []} draft={stakeholder} setDraft={setStakeholder} onAdd={() => mutations.createStakeholder.mutate(stakeholder)} onImportImpact={() => mutations.importFromImpact.mutate()} onImportEquipment={() => mutations.importFromEquipment.mutate()} />
        <CommunicationPlanPanel plan={data?.plan} draft={plan} setDraft={setPlan} onSave={() => mutations.updatePlan.mutate(plan)} onSend={() => mutations.sendCommunication.mutate({ ...plan, subject: `MOC Communication - ${moc.moc_number ?? moc.id}`, body: plan.messageSummary })} onSchedule={() => mutations.scheduleCommunication.mutate(plan)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <CommunicationLogTable rows={data?.logs ?? []} onResend={(logId: string) => mocCommunicationTrainingService.resendLog(moc.id, logId)} onReminder={(logId: string) => mocCommunicationTrainingService.remindLog(moc.id, logId)} />
        <AcknowledgementTracker rows={data?.acknowledgements ?? []} onAck={(ackId: string) => mutations.acknowledge.mutate({ ackId, values: { acknowledgementMethod: 'In-app acknowledgement' } })} onWaive={(ackId: string) => mutations.waiveAck.mutate({ ackId, values: { waiverReason: 'Waived by authorized reviewer' } })} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <TrainingRequirementsPanel rows={data?.trainingRequirements ?? []} draft={training} setDraft={setTraining} onCreate={() => mutations.createTraining.mutate(training)} onGenerate={() => mutations.generateTrainingFromImpact.mutate()} />
        <TrainingCompletionTracker rows={assignments} onComplete={(assignmentId: string) => mutations.completeAssignment.mutate({ assignmentId, values: { completionMethod: 'Manual completion' } })} onVerify={(assignmentId: string) => mutations.verifyAssignment.mutate({ assignmentId, values: { verificationNotes: 'Verified from MOC training tracker.' } })} />
      </div>
      <StartupTrainingBlockersPanel rows={data?.startupBlockers ?? []} />
    </div>
  );
}
