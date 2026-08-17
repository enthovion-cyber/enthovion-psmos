'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMocTrainingMutations } from '../hooks/useMocTrainingMutations';
import { validateMocTrainingRequirement } from '../schemas/moc-training-requirement.schema';
import { TrainingButton, TrainingCard, formatTrainingError } from '../shared/TrainingUi';
import { MocAffectedWorkersSection } from './sections/MocAffectedWorkersSection';
import { MocAssignmentsNotificationsSection } from './sections/MocAssignmentsNotificationsSection';
import { MocDueBlockingRulesSection } from './sections/MocDueBlockingRulesSection';
import { MocRequiredEvidenceSection } from './sections/MocRequiredEvidenceSection';
import { MocTrainingContextSection } from './sections/MocTrainingContextSection';
import { MocTrainingImpactSection } from './sections/MocTrainingImpactSection';

export function TrainingMocRequirementForm({ initialValues = {}, requirementId }: { initialValues?: Record<string, any>; requirementId?: string }) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();
  const mutations = useMocTrainingMutations();
  const saving = mutations.create.isPending || mutations.update.isPending;
  async function save() {
    const nextErrors = validateMocTrainingRequirement(values);
    setErrors(nextErrors);
    if (nextErrors.length) return;
    const result = requirementId ? await mutations.update.mutateAsync({ requirementId, payload: values }) : await mutations.create.mutateAsync(values);
    const id = requirementId ?? result.requirement?.id;
    if (id) router.push(`/training-competency/moc-training-requirements/${id}`);
  }
  return <TrainingCard title={requirementId ? 'Edit MOC Training Requirement' : 'New MOC Training Requirement'} subtitle="All mutations are saved through backend APIs with audit/history events."><div className="space-y-6"><MocTrainingContextSection values={values} onChange={setValues} /><MocTrainingImpactSection values={values} onChange={setValues} /><MocRequiredEvidenceSection values={values} /><MocDueBlockingRulesSection values={values} onChange={setValues} /><MocAffectedWorkersSection rows={[]} /><MocAssignmentsNotificationsSection rows={[]} />{errors.length ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">Missing required fields: {errors.join(', ')}</div> : null}{mutations.create.error || mutations.update.error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{formatTrainingError(mutations.create.error ?? mutations.update.error)}</div> : null}<div className="flex flex-wrap gap-2"><TrainingButton onClick={save} disabled={saving} title={saving ? 'Saving requirement to backend.' : undefined}>{saving ? 'Saving...' : 'Save Requirement'}</TrainingButton><TrainingButton href="/training-competency/moc-training-requirements/register" variant="secondary">Cancel</TrainingButton></div></div></TrainingCard>;
}
