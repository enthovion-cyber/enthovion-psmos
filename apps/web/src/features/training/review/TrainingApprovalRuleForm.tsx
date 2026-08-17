'use client';

import { useState } from 'react';
import { TrainingButton, TrainingCard, TrainingErrorState } from '../shared/TrainingUi';
import { useTrainingApprovalRuleMutations } from '../hooks/useTrainingApprovalRules';
import { ApprovalRuleIdentitySection } from './sections/ApprovalRuleIdentitySection';
import { ApprovalRuleTriggerSection } from './sections/ApprovalRuleTriggerSection';
import { ApprovalRuleStagesSection } from './sections/ApprovalRuleStagesSection';
import { ApprovalRuleValidationSection } from './sections/ApprovalRuleValidationSection';
import { ApprovalRuleEsignatureSection } from './sections/ApprovalRuleEsignatureSection';

export function TrainingApprovalRuleForm({ initial, ruleId }: { initial?: Record<string, any> | undefined; ruleId?: string | undefined }) {
  const [draft, setDraft] = useState<Record<string, any>>(initial ?? { triggerEvent: 'Submit', sourceModule: 'Required Training', sourceRecordType: 'Training library item', ruleStatus: 'Draft', stages: [{ stageName: 'Reviewer Approval', stageOrder: 1, stageType: 'Single Reviewer', reviewerRole: 'Training Reviewer', slaHours: 72 }] });
  const mutations = useTrainingApprovalRuleMutations(ruleId);
  const save = () => ruleId ? mutations.update.mutate(draft) : mutations.create.mutate(draft);
  const error = mutations.create.error ?? mutations.update.error;
  return <div className="space-y-4">{error ? <TrainingErrorState message={error} /> : null}<ApprovalRuleIdentitySection value={draft} onChange={setDraft} /><ApprovalRuleTriggerSection value={draft} onChange={setDraft} /><ApprovalRuleStagesSection value={draft} onChange={setDraft} /><ApprovalRuleValidationSection value={draft} onChange={setDraft} /><ApprovalRuleEsignatureSection value={draft} onChange={setDraft} /><TrainingCard><div className="flex flex-wrap justify-end gap-2"><TrainingButton onClick={save} disabled={mutations.create.isPending || mutations.update.isPending || !draft.ruleTitle || !draft.sourceModule || !draft.sourceRecordType} title={!draft.ruleTitle ? 'Rule title is required.' : !draft.sourceModule ? 'Source module is required.' : !draft.sourceRecordType ? 'Source record type is required.' : ''}>{ruleId ? 'Save Rule' : 'Create Rule'}</TrainingButton>{ruleId ? <TrainingButton variant="secondary" onClick={() => mutations.activate.mutate()} disabled={mutations.activate.isPending}>Activate</TrainingButton> : null}</div></TrainingCard></div>;
}
