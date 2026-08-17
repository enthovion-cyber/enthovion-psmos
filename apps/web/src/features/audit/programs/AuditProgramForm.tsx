'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { AuditProgram } from '../types/audit.types';
import { validateAuditProgramActivation, validateAuditProgramDraft } from '../schemas/audit-program.schema';
import { useAuditContext, useAuditLookups } from '../hooks/useAuditLookups';
import { useAuditProgramMutations } from '../hooks/useAuditProgramMutations';
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState, formatAuditError } from '../shared/AuditUi';
import { AuditConfigurationHealthBadge } from '../shared/AuditConfigurationHealthBadge';
import { ProgramFrequencySection } from './sections/ProgramFrequencySection';
import { ProgramIdentitySection } from './sections/ProgramIdentitySection';
import { ProgramIntegrationSettingsSection } from './sections/ProgramIntegrationSettingsSection';
import { ProgramModulesSection } from './sections/ProgramModulesSection';
import { ProgramOwnershipSection } from './sections/ProgramOwnershipSection';
import { ProgramScopeSection } from './sections/ProgramScopeSection';
import { ProgramStandardsSection } from './sections/ProgramStandardsSection';

const steps = ['Program Identity', 'Scope', 'Standards / Regulations', 'Modules Covered', 'Frequency / Review Cycle', 'Ownership / Governance', 'Integration Settings', 'Review & Save'];

export function AuditProgramForm({ initialProgram }: { initialProgram?: Partial<AuditProgram> | undefined }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<AuditProgram>>({ program_status: 'Draft', criticality: 'Medium', ...initialProgram });
  const lookups = useAuditLookups();
  const context = useAuditContext();
  const actions = useAuditProgramMutations(form.id);
  const draftMissing = useMemo(() => validateAuditProgramDraft(form), [form]);
  const activationMissing = useMemo(() => validateAuditProgramActivation(form), [form]);
  const update = (patch: Partial<AuditProgram>) => setForm((current) => ({ ...current, ...patch }));
  const busy = actions.create.isPending || actions.update.isPending;
  if (lookups.isLoading || context.isLoading) return <AuditLoadingState rows={6} />;
  if (lookups.isError) return <AuditErrorState message={lookups.error} onRetry={() => lookups.refetch()} />;
  if (context.isError) return <AuditErrorState message={context.error} onRetry={() => context.refetch()} />;

  const save = async (activate: boolean) => {
    const missing = activate ? activationMissing : draftMissing;
    if (missing.length) {
      window.alert(`${activate ? 'Activation' : 'Save'} blocked: ${missing.join(', ')}`);
      return;
    }
    const result = form.id ? await actions.update.mutateAsync(form as Record<string, unknown>) : await actions.create.mutateAsync(form as Record<string, unknown>);
    if (activate) await actions.activate.mutateAsync(result.program.id);
    router.push(`/audit-compliance/programs/${result.program.id}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">{steps.map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${step === index ? 'border-primary bg-primary text-white' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>{index + 1}. {label}</button>)}</div>
      <AuditCard title={steps[step] ?? 'Review & Save'} subtitle="Drafts can be saved with partial information; activation uses backend validation and configuration-health calculation.">
        {step === 0 ? <ProgramIdentitySection form={form} update={update} lookups={lookups.data} /> : null}
        {step === 1 ? <ProgramScopeSection form={form} update={update} context={context.data} lookups={lookups.data} /> : null}
        {step === 2 ? <ProgramStandardsSection form={form} update={update} lookups={lookups.data} /> : null}
        {step === 3 ? <ProgramModulesSection form={form} update={update} lookups={lookups.data} /> : null}
        {step === 4 ? <ProgramFrequencySection form={form} update={update} lookups={lookups.data} /> : null}
        {step === 5 ? <ProgramOwnershipSection form={form} update={update} context={context.data} /> : null}
        {step === 6 ? <ProgramIntegrationSettingsSection form={form} update={update} /> : null}
        {step === 7 ? <ReviewStep form={form} activationMissing={activationMissing} /> : null}
      </AuditCard>
      {actions.create.error || actions.update.error || actions.activate.error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{formatAuditError(actions.create.error || actions.update.error || actions.activate.error)}</div> : null}
      <div className="flex flex-wrap justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
        <AuditButton variant="secondary" onClick={() => setStep(Math.max(step - 1, 0))} disabled={step === 0} title="Already on the first step.">Back</AuditButton>
        <div className="flex flex-wrap gap-2"><AuditButton variant="secondary" onClick={() => save(false)} disabled={busy} title={draftMissing.length ? `Missing required draft fields: ${draftMissing.join(', ')}` : 'Save draft to backend.'}>Save Draft</AuditButton><AuditButton variant="secondary" onClick={() => setStep(Math.min(step + 1, steps.length - 1))} disabled={step === steps.length - 1} title={step === steps.length - 1 ? 'Already on review step.' : 'Continue to next wizard step.'}>Next</AuditButton><AuditButton onClick={() => save(true)} disabled={busy || activationMissing.length > 0} title={activationMissing.length ? `Activation blocked: ${activationMissing.join(', ')}` : 'Create and activate audit program.'}>Activate Program</AuditButton></div>
      </div>
    </div>
  );
}

function ReviewStep({ form, activationMissing }: { form: Partial<AuditProgram>; activationMissing: string[] }) {
  return <div className="space-y-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[['Program identity', `${form.program_code ?? 'Missing'} - ${form.program_title ?? 'Missing'}`], ['Scope', `${form.scopes?.length ?? 0} scopes`], ['Standards/regulations', `${form.standards?.length ?? 0} references`], ['Modules covered', `${form.modules?.length ?? 0} modules`], ['Frequency/review', form.frequency?.audit_frequency ?? 'Missing'], ['Ownership', form.owner_user_id ? 'Owner selected' : 'Missing owner'], ['Integration settings', (form as any).integrationSettings ? 'Configured' : 'Default foundation settings'], ['Configuration health', activationMissing.length ? 'Configuration Incomplete' : 'Complete']].map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{label}</p><p className="mt-2 text-sm font-semibold">{value}</p></div>)}</div>{activationMissing.length ? <AuditEmptyState title="Missing required fields" message={activationMissing.join(', ')} /> : <div><AuditConfigurationHealthBadge value="Complete" /></div>}</div>;
}
