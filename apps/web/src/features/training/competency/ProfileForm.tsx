'use client';

import { useState } from 'react';
import { validateCompetencyProfile } from '../schemas/competency-profile.schema';
import { TrainingButton, TrainingCard, TrainingErrorState } from '../shared/TrainingUi';
import { CompetencyRequirementsSection } from './sections/CompetencyRequirementsSection';
import { EvidenceVerificationRulesSection } from './sections/EvidenceVerificationRulesSection';
import { MatrixBlockingImpactSection } from './sections/MatrixBlockingImpactSection';
import { ProfileIdentitySection } from './sections/ProfileIdentitySection';
import { ProfileScopeApplicabilitySection } from './sections/ProfileScopeApplicabilitySection';
import { RoleDutiesSafetyCriticalSection } from './sections/RoleDutiesSafetyCriticalSection';

const steps = ['Profile Identity', 'Scope / Applicability', 'Role Duties / Safety-Critical Tasks', 'Competency Requirements', 'Evidence / Verification Rules', 'Matrix / Blocking Impact', 'Review & Save'];

export function ProfileForm({ initial = {}, onSubmit, isSaving, error }: { initial?: Record<string, any>; onSubmit: (value: Record<string, any>) => void; isSaving?: boolean; error?: string }) {
  const [step, setStep] = useState(0);
  const [value, setValue] = useState<Record<string, any>>({ profileStatus: 'Draft', reviewStatus: 'Not Submitted', matrixSyncStatus: 'Not Synced', version: '1.0', profileType: 'Job Role Profile', requirements: [], duties: [], scopes: [], ...snakeToCamel(initial) });
  const [errors, setErrors] = useState<string[]>([]);
  const patch = (next: Record<string, any>) => setValue((old) => ({ ...old, ...next }));
  const next = () => {
    const missing = step === 0 ? validateCompetencyProfile(value) : [];
    setErrors(missing);
    if (!missing.length) setStep((old) => Math.min(old + 1, steps.length - 1));
  };
  return <div className="space-y-4">{error ? <TrainingErrorState message={error} /> : null}<div className="flex gap-2 overflow-x-auto pb-1">{steps.map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${index === step ? 'border-primary bg-primary text-white' : 'border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-muted)]'}`}>{index + 1}. {label}</button>)}</div>{errors.length ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">Missing/invalid: {errors.join(', ')}</div> : null}{step === 0 ? <ProfileIdentitySection value={value} onChange={patch} /> : null}{step === 1 ? <ProfileScopeApplicabilitySection value={value} onChange={patch} /> : null}{step === 2 ? <RoleDutiesSafetyCriticalSection value={value} onChange={patch} /> : null}{step === 3 ? <CompetencyRequirementsSection value={value} onChange={patch} /> : null}{step === 4 ? <EvidenceVerificationRulesSection value={value} onChange={patch} /> : null}{step === 5 ? <MatrixBlockingImpactSection value={value} onChange={patch} /> : null}{step === 6 ? <ReviewStep value={value} /> : null}<div className="flex flex-wrap justify-between gap-2"><TrainingButton variant="secondary" onClick={() => setStep((old) => Math.max(0, old - 1))} disabled={step === 0} title={step === 0 ? 'Already at first step' : ''}>Back</TrainingButton><div className="flex gap-2">{step < steps.length - 1 ? <TrainingButton onClick={next}>Next</TrainingButton> : <TrainingButton onClick={() => onSubmit(value)} disabled={Boolean(isSaving)} title={isSaving ? 'Saving competency profile' : ''}>{isSaving ? 'Saving...' : 'Save as Draft'}</TrainingButton>}<TrainingButton onClick={() => onSubmit({ ...value, profileStatus: 'Active' })} disabled={Boolean(isSaving)} title={isSaving ? 'Saving competency profile' : 'Activation validates requirements on backend'} variant="secondary">Activate</TrainingButton></div></div></div>;
}

function ReviewStep({ value }: { value: Record<string, any> }) {
  return <TrainingCard title="Review & Save" subtitle="Backend will validate activation, lock approved profiles, and create audit/history."><div className="grid gap-3 md:grid-cols-3">{[['Profile', value.profileName], ['Scope', value.scopes?.length ? `${value.scopes.length} scope rows` : 'Company/site default'], ['Duties', value.duties?.length ?? 0], ['Competency requirements', value.requirements?.length ?? 0], ['Safety-critical', value.safetyCritical ? 'Yes' : 'No'], ['PTW-critical', value.ptwCritical ? 'Yes' : 'No'], ['Matrix sync', value.matrixSyncStatus], ['Blocking impact', [value.blocksPtwAuthorization && 'PTW', value.blocksMocImplementation && 'MOC', value.blocksPssrStartup && 'PSSR'].filter(Boolean).join(', ') || 'None'], ['Activation status', value.profileStatus]].map(([label, text]) => <div key={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 font-semibold">{text as any}</p></div>)}</div></TrainingCard>;
}

function snakeToCamel(row: Record<string, any>) {
  const mapped: Record<string, any> = {};
  Object.entries(row).forEach(([key, value]) => {
    mapped[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = value;
  });
  return mapped;
}
