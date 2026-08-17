'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePssrTrainingMutations } from '../hooks/usePssrTrainingMutations';
import { validatePssrTrainingReadiness } from '../schemas/pssr-training-readiness.schema';
import { TrainingButton, TrainingCard, formatTrainingError } from '../shared/TrainingUi';
import { PssrRequiredWorkersSection } from './sections/PssrRequiredWorkersSection';
import { PssrAssignmentsNotificationsSection } from './sections/PssrAssignmentsNotificationsSection';
import { PssrDueBlockingRulesSection } from './sections/PssrDueBlockingRulesSection';
import { PssrRequiredEvidenceSection } from './sections/PssrRequiredEvidenceSection';
import { PssrTrainingContextSection } from './sections/PssrTrainingContextSection';
import { PssrTrainingImpactSection } from './sections/PssrTrainingImpactSection';

export function TrainingPssrReadinessForm({ initialValues = {}, readinessId }: { initialValues?: Record<string, any>; readinessId?: string }) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();
  const mutations = usePssrTrainingMutations();
  const saving = mutations.create.isPending || mutations.update.isPending;
  async function save() {
    const nextErrors = validatePssrTrainingReadiness(values);
    setErrors(nextErrors);
    if (nextErrors.length) return;
    const result = readinessId ? await mutations.update.mutateAsync({ readinessId, payload: values }) : await mutations.create.mutateAsync(values);
    const id = readinessId ?? result.readiness?.id;
    if (id) router.push(`/training-competency/pssr-training-readiness/${id}`);
  }
  return <TrainingCard title={readinessId ? 'Edit PSSR Training Readiness' : 'New PSSR Training Readiness'} subtitle="All mutations are saved through backend APIs with audit/history events."><div className="space-y-6"><PssrTrainingContextSection values={values} onChange={setValues} /><PssrTrainingImpactSection values={values} onChange={setValues} /><PssrRequiredEvidenceSection values={values} /><PssrDueBlockingRulesSection values={values} onChange={setValues} /><PssrRequiredWorkersSection rows={[]} /><PssrAssignmentsNotificationsSection rows={[]} />{errors.length ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">Missing required fields: {errors.join(', ')}</div> : null}{mutations.create.error || mutations.update.error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{formatTrainingError(mutations.create.error ?? mutations.update.error)}</div> : null}<div className="flex flex-wrap gap-2"><TrainingButton onClick={save} disabled={saving} title={saving ? 'Saving readiness to backend.' : undefined}>{saving ? 'Saving...' : 'Save Readiness'}</TrainingButton><TrainingButton href="/training-competency/pssr-training-readiness/register" variant="secondary">Cancel</TrainingButton></div></div></TrainingCard>;
}

