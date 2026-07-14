'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, CheckCircle2, Save } from 'lucide-react';
import { usePSSRContext, usePSSRCreate } from '../../hooks/usePSSRCreate';
import { pssrCreateSchema, type PSSRCreateValues } from '../../schemas/pssr-create.schema';
import { ErrorState, LoadingState } from '../pssr-ui';
import { PSSRBasicInfoStep } from './PSSRBasicInfoStep';
import { PSSRLinkedMOCStep } from './PSSRLinkedMOCStep';
import { PSSRAffectedEquipmentStep } from './PSSRAffectedEquipmentStep';
import { PSSRStartupScopeStep } from './PSSRStartupScopeStep';
import { PSSRChecklistPreviewStep } from './PSSRChecklistPreviewStep';
import { PSSRStartupBlockersPreviewStep } from './PSSRStartupBlockersPreviewStep';
import { PSSRReviewCreateStep } from './PSSRReviewCreateStep';

const steps = ['Basic Information', 'Linked MOC / Trigger', 'Location & Equipment', 'Startup Scope', 'Checklist Preview', 'Blockers Preview', 'Review & Create'];

export function PSSRCreateWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const mocId = params.get('moc_id');
  const { context, mocContext } = usePSSRContext(mocId);
  const create = usePSSRCreate();
  const [step, setStep] = useState(0);
  const moc = mocContext.data?.moc;
  const form = useForm<PSSRCreateValues>({
    resolver: zodResolver(pssrCreateSchema),
    values: {
      title: moc ? `PSSR for ${moc.moc_number} - ${moc.title}` : '',
      description: moc?.description ?? '',
      pssrType: moc ? 'MOC Startup Review' : 'MOC Startup Review',
      startupType: moc?.change_type === 'Emergency Change' ? 'Startup after emergency change' : moc ? 'Startup after MOC' : 'Initial startup',
      triggerSource: moc ? 'MOC' : 'Manual',
      mocId: mocId ?? undefined,
      companyId: moc?.company_id,
      siteId: moc?.site_id ?? '',
      unitId: moc?.unit_id ?? '',
      areaId: moc?.area_id ?? '',
      departmentId: moc?.department_id ?? '',
      requestedStartupAt: '',
      targetStartupAt: moc?.target_implementation_date ?? '',
      coordinatorId: moc?.originator_id ?? '',
      originatorId: '',
      priority: moc?.priority ?? 'Medium',
      riskLevel: moc?.risk_level ?? 'Medium',
      primaryEquipmentId: mocContext.data?.equipment?.[0]?.equipment_id ?? '',
      additionalEquipmentIds: [],
      systemService: '',
      locationDescription: moc?.location_description ?? '',
      startupScope: { startupScopeDescription: moc?.description ?? '', whatChanged: moc?.title ?? '' },
      startupBoundaries: '',
      startupHazards: ['High', 'Critical'].includes(moc?.risk_level) ? 'High/Critical startup hazards require field verification and authorization.' : '',
      startupPrerequisites: 'Required MOC actions, training, document readiness, testing, and authorization must be complete before startup.',
      temporaryControls: '',
      submit: true
    }
  });
  const current = useMemo(() => [
    <PSSRBasicInfoStep key="basic" form={form} context={context.data} />,
    <PSSRLinkedMOCStep key="moc" form={form} mocContext={mocContext.data} loading={mocContext.isLoading} />,
    <PSSRAffectedEquipmentStep key="equipment" form={form} context={context.data} mocContext={mocContext.data} />,
    <PSSRStartupScopeStep key="scope" form={form} />,
    <PSSRChecklistPreviewStep key="checklist" items={mocContext.data?.checklistPreview ?? []} />,
    <PSSRStartupBlockersPreviewStep key="blockers" items={mocContext.data?.blockersPreview ?? []} />,
    <PSSRReviewCreateStep key="review" values={form.watch()} mocContext={mocContext.data} />
  ], [context.data, form, mocContext.data, mocContext.isLoading]);

  async function submit(values: PSSRCreateValues) {
    const result = await create.mutateAsync(values);
    router.push(`/pssr/${result.id}`);
  }

  if (context.isLoading) return <main className="min-h-screen bg-[#020b16] p-5 text-white"><LoadingState /></main>;
  if (context.isError) return <main className="min-h-screen bg-[#020b16] p-5 text-white"><ErrorState message="Unable to load PSSR create context." /></main>;
  return (
    <main className="min-h-screen bg-[#020b16] p-4 text-slate-100 sm:p-5">
      <form onSubmit={form.handleSubmit(submit)} className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col gap-3 rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Module 05 · OSHA 1910.119(i)</p><h1 className="mt-1 text-3xl font-black text-white">Create Pre-Startup Safety Review</h1><p className="mt-2 text-sm text-slate-400">Manual, MOC-triggered, equipment, project, shutdown, commissioning, and restart PSSR creation.</p></div>
          <div className="flex gap-2"><button type="button" onClick={() => router.push('/pssr')} className="rounded-md border border-white/10 px-4 py-2 text-sm font-black">Cancel</button><button type="submit" disabled={create.isPending} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-black text-white"><Save size={16} /> Create PSSR</button></div>
        </header>
        <section className="rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-4">
          <div className="grid gap-2 md:grid-cols-7">{steps.map((item, index) => <button key={item} type="button" onClick={() => setStep(index)} className={`rounded-lg border px-3 py-2 text-left text-xs font-black ${index === step ? 'border-blue-300/50 bg-blue-500/15 text-blue-100' : 'border-white/10 bg-white/[0.03] text-slate-400'}`}>{index + 1}. {item}</button>)}</div>
        </section>
        {mocContext.data?.existingPssr ? <div className="rounded-lg border border-amber-300/20 bg-amber-500/10 p-3 text-sm font-bold text-amber-100">Existing active PSSR found for this MOC: {mocContext.data.existingPssr.pssr_number}</div> : null}
        {current[step]}
        <footer className="flex items-center justify-between rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-4">
          <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-black disabled:opacity-40"><ArrowLeft size={16} /> Back</button>
          {step < steps.length - 1 ? <button type="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-black text-white">Next <ArrowRight size={16} /></button> : <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-black text-white"><CheckCircle2 size={16} /> Create & Open</button>}
        </footer>
      </form>
    </main>
  );
}
