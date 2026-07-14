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

const steps = ['Basic Change Information', 'Affected Location & Equipment', 'Change Description', 'Risk Ranking', 'Impact Assessment', 'Temporary / Emergency Controls', 'Engineering Package', 'Required Actions Preview', 'Review & Submit'];

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
      <form className="min-h-screen bg-[#020b16] text-slate-100" onSubmit={form.handleSubmit((values) => submit(values, 'submit'))}>
        <header className="border-b border-cyan-300/10 bg-[#04101f]/95 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Module 04 / OSHA 1910.119(l)</p><h1 className="mt-1 text-2xl font-black text-white">Create MOC Request</h1><p className="mt-2 text-sm text-slate-400">API-driven MOC creation wizard with equipment lookup, risk ranking, impacts, controls, engineering package, generated actions, workflow, audit, notifications, and search indexing.</p></div>
            <div className="rounded-xl border border-cyan-300/10 bg-slate-950/35 p-3 text-right"><p className="text-xs text-slate-400">Calculated Risk</p><p className={`text-2xl font-black ${risk.level === 'Critical' ? 'text-red-300' : risk.level === 'High' ? 'text-amber-300' : 'text-emerald-300'}`}>{risk.level} / {risk.score}</p></div>
          </div>
          <nav className="mt-5 grid gap-2 md:grid-cols-3 xl:grid-cols-9">
            {steps.map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={`rounded-lg border px-2 py-2 text-xs font-bold ${step === index ? 'border-blue-300/70 bg-blue-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-400'}`}>{index + 1}. {label}</button>)}
          </nav>
        </header>
        <main className="p-4">{context.isLoading ? <div className="rounded-xl border border-cyan-300/10 bg-[#07182a] p-6 text-slate-300">Loading MOC context...</div> : current}</main>
        <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-300/10 bg-[#04101f]/95 p-4">
          <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-40"><ArrowLeft size={15} /> Back</button>
          <div className="flex gap-2">
            <button type="button" onClick={() => submit(form.getValues(), 'draft')} className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-100"><Save size={15} /> Save Draft</button>
            {step < steps.length - 1 ? <button type="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white">Next <ArrowRight size={15} /></button> : <button type="submit" disabled={createMoc.isPending} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"><Send size={15} /> Submit for Review</button>}
          </div>
        </footer>
      </form>
    </FormProvider>
  );
}
