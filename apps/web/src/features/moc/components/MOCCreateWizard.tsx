'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Save, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { useState } from 'react';
import { useCreateMOC } from '../hooks/useCreateMOC';
import { useMOCContext } from '../hooks/useMOCContext';
import { defaultMocValues, mocCreateSchema, riskFromValues, type MOCCreateValues } from '../schemas/moc.schema';
import { MOCBasicInfoStep } from './create/MOCBasicInfoStep';
import { MOCAffectedLocationStep } from './create/MOCAffectedLocationStep';
import { MOCChangeDescriptionStep } from './create/MOCChangeDescriptionStep';
import { MOCRiskRankingStep } from './create/MOCRiskRankingStep';
import { MOCImpactAssessmentStep } from './create/MOCImpactAssessmentStep';
import { MOCTemporaryEmergencyStep } from './create/MOCTemporaryEmergencyStep';
import { MOCEngineeringPackageStep } from './create/MOCEngineeringPackageStep';
import { MOCRequiredActionsPreviewStep } from './create/MOCRequiredActionsPreviewStep';
import { MOCReviewSubmitStep } from './create/MOCReviewSubmitStep';

const steps = ['Basic Info', 'Location & Equipment', 'Change Description', 'Risk Ranking', 'Impact Assessment', 'Temporary / Emergency Controls', 'Engineering Package', 'Required Actions Preview', 'Review & Submit'];

export function MOCCreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const context = useMOCContext();
  const createMoc = useCreateMOC();
  const form = useForm<MOCCreateValues>({ resolver: zodResolver(mocCreateSchema), defaultValues: defaultMocValues, mode: 'onChange' });
  const risk = riskFromValues(form.watch());
  const submit = async (values: MOCCreateValues, mode: 'draft' | 'submit') => {
    const moc = await createMoc.mutateAsync({ values, submit: mode === 'submit' });
    router.push(`/moc/${moc.id}`);
  };
  const current = [
    <MOCBasicInfoStep key="basic" context={context.data} />,
    <MOCAffectedLocationStep key="location" context={context.data} />,
    <MOCChangeDescriptionStep key="description" />,
    <MOCRiskRankingStep key="risk" />,
    <MOCImpactAssessmentStep key="impact" />,
    <MOCTemporaryEmergencyStep key="controls" context={context.data} />,
    <MOCEngineeringPackageStep key="engineering" />,
    <MOCRequiredActionsPreviewStep key="actions" />,
    <MOCReviewSubmitStep key="review" />
  ][step];
  return (
    <FormProvider {...form}>
      <form className="min-h-screen bg-[var(--psm-bg)] text-[var(--psm-fg)]" onSubmit={form.handleSubmit((values) => submit(values, 'submit'))}>
        <header className="border-b border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Module 04 / OSHA 1910.119(l)</p>
              <h1 className="mt-1 text-2xl font-black text-[var(--psm-fg)]">Create MOC Request</h1>
              <p className="mt-1 text-sm text-[var(--psm-muted)]">Enterprise-grade MOC creation wizard with equipment lookup, risk ranking, impacts, controls, engineering package, generated actions, workflow, and search indexing.</p>
            </div>
            <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5 text-right shrink-0">
              <p className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider">Calculated Risk</p>
              <p className={`text-2xl font-black ${risk.level === 'Critical' ? 'text-red-500' : risk.level === 'High' ? 'text-amber-500' : 'text-emerald-500'}`}>{risk.level} / {risk.score}</p>
            </div>
          </div>
          <nav className="mt-5 flex flex-wrap gap-2">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                  step === index
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)] hover:text-[var(--psm-fg)] hover:border-primary/50'
                }`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </nav>
        </header>
        <main className="p-6 max-w-7xl mx-auto">{context.isLoading ? <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 text-[var(--psm-muted)]">Loading MOC context...</div> : current}</main>
        <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--psm-line)] bg-[var(--psm-surface)]/95 backdrop-blur p-4 shadow-lg">
          <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-4 py-2 text-sm font-bold text-[var(--psm-fg)] hover:bg-[var(--psm-surface)] disabled:opacity-40 transition-all"><ArrowLeft size={15} /> Back</button>
          <div className="flex gap-2">
            <button type="button" onClick={() => submit(form.getValues(), 'draft')} className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20 transition-all"><Save size={15} /> Save Draft</button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow hover:opacity-90 transition-all">Next <ArrowRight size={15} /></button>
            ) : (
              <button type="submit" disabled={createMoc.isPending} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-60 transition-all"><Send size={15} /> Submit for Review</button>
            )}
          </div>
        </footer>
      </form>
    </FormProvider>
  );
}
