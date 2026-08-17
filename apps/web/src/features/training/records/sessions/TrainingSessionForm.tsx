'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { trainingRecordsService } from '../../services/training-records.service';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { SessionEvidenceVerificationSection } from './sections/SessionEvidenceVerificationSection';
import { SessionIdentitySection } from './sections/SessionIdentitySection';
import { SessionInstructorProviderSection } from './sections/SessionInstructorProviderSection';
import { SessionLinksPurposeSection } from './sections/SessionLinksPurposeSection';
import { SessionRosterSelectionSection } from './sections/SessionRosterSelectionSection';
import { SessionScheduleLocationSection } from './sections/SessionScheduleLocationSection';
import { SessionTrainingItemVersionSection } from './sections/SessionTrainingItemVersionSection';

const steps = ['Session Identity', 'Training Item / Version', 'Schedule / Location', 'Instructor / Provider', 'Roster Selection', 'Evidence / Verification Rules', 'Links / Purpose', 'Review & Save'];

export function TrainingSessionForm({ sessionId }: { sessionId?: string | undefined }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, any>>({ sessionStatus: 'Draft', sessionType: 'Classroom', attendanceMethod: 'Manual attendance', roster: [], links: [] });
  const context = useQuery({ queryKey: ['training-records', 'context'], queryFn: () => trainingRecordsService.context() });
  const existing = useQuery({ queryKey: ['training-records', 'session', sessionId], queryFn: () => trainingRecordsService.sessionDetail(sessionId ?? ''), enabled: Boolean(sessionId) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const mergedForm = useMemo(() => existing.data?.session && !form.id ? { ...existing.data.session, ...form } : form, [existing.data, form]);
  if (context.isLoading || existing.isLoading) return <TrainingLoadingState />;
  if (context.isError) return <TrainingErrorState message={context.error} onRetry={() => context.refetch()} />;
  const update = (patch: Record<string, any>) => setForm((current) => ({ ...current, ...patch }));
  const missing = validateStep(step, mergedForm);
  const save = async (status?: string) => {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...mergedForm, ...(status ? { sessionStatus: status } : {}) };
      const saved = sessionId ? await trainingRecordsService.updateSession(sessionId, payload) : await trainingRecordsService.createSession(payload);
      router.push(`/training-competency/training-records/sessions/${saved.session.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step < steps.length - 1) setStep((value) => value + 1);
    else void save('Scheduled');
  };
  return (
    <form onSubmit={submit} className="space-y-5">
      <TrainingCard title={sessionId ? 'Edit Training Session' : 'Create Training Session'} subtitle="Wizard follows the Phase 5 PDF flow and validates before scheduling.">
        <div className="grid gap-2 md:grid-cols-4">{steps.map((label, index) => <button type="button" key={label} onClick={() => setStep(index)} className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold ${index === step ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>{index + 1}. {label}</button>)}</div>
      </TrainingCard>
      {step === 0 && <SessionIdentitySection form={mergedForm} update={update} context={context.data} />}
      {step === 1 && <SessionTrainingItemVersionSection form={mergedForm} update={update} context={context.data} />}
      {step === 2 && <SessionScheduleLocationSection form={mergedForm} update={update} context={context.data} />}
      {step === 3 && <SessionInstructorProviderSection form={mergedForm} update={update} context={context.data} />}
      {step === 4 && <SessionRosterSelectionSection form={mergedForm} update={update} context={context.data} />}
      {step === 5 && <SessionEvidenceVerificationSection form={mergedForm} update={update} context={context.data} />}
      {step === 6 && <SessionLinksPurposeSection form={mergedForm} update={update} context={context.data} />}
      {step === 7 && <TrainingCard title="Review & Save"><pre className="max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(mergedForm, null, 2)}</pre></TrainingCard>}
      {missing.length ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Missing fields: {missing.join(', ')}</div> : null}
      {error ? <TrainingErrorState message={error} /> : null}
      <div className="flex flex-wrap justify-between gap-2">
        <TrainingButton variant="secondary" onClick={() => setStep((value) => Math.max(value - 1, 0))} disabled={step === 0}>Back</TrainingButton>
        <div className="flex gap-2">
          <TrainingButton variant="secondary" onClick={() => save('Draft')} disabled={saving} title={saving ? 'Saving draft' : 'Save as draft through backend API.'}>Save draft</TrainingButton>
          <TrainingButton type="submit" disabled={Boolean(missing.length) || saving} title={missing.length ? `Complete: ${missing.join(', ')}` : 'Continue or schedule through backend API.'}>{step < steps.length - 1 ? 'Next' : 'Schedule session'}</TrainingButton>
        </div>
      </div>
    </form>
  );
}

function validateStep(step: number, form: Record<string, any>) {
  const required: string[] = [];
  if (step === 0 && !form.sessionTitle && !form.session_title) required.push('Session title');
  if (step === 0 && !form.siteId && !form.site_id) required.push('Site');
  if (step === 0 && !form.ownerUserId && !form.owner_user_id) required.push('Session owner');
  if (step === 1 && !form.trainingItemId && !form.training_item_id && !form.legacyTrainingTitle) required.push('Required Training item or legacy reason');
  if (step === 2 && form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) required.push('Valid start/end time');
  if (step === 3 && !form.instructorWorkerId && !form.instructorUserId && !form.externalInstructorName) required.push('Instructor or provider');
  return required;
}
