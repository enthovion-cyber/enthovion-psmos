'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, Save, ShieldCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useMutationToast } from '@/providers/ToastProvider';
import { useCreatePermit, missingRequirements } from '../hooks/useCreatePermit';
import { usePermitContext } from '../hooks/usePermitContext';
import { defaultPermitCreateValues, permitCreateSchema, type PermitCreateValues } from '../schemas/permit.schema';
import { PermitAttachmentsStep } from './PermitAttachmentsStep';
import { PermitBasicInfoStep } from './PermitBasicInfoStep';
import { PermitGasTestPlanStep } from './PermitGasTestPlanStep';
import { PermitIsolationPlanStep } from './PermitIsolationPlanStep';
import { PermitLocationEquipmentStep } from './PermitLocationEquipmentStep';
import { PermitReviewSubmitStep } from './PermitReviewSubmitStep';
import { PermitTypeRequirementsStep } from './PermitTypeRequirementsStep';
import { PermitWorkDescriptionStep } from './PermitWorkDescriptionStep';
import { PermitWorkforceStep } from './PermitWorkforceStep';

const steps = [
  { title: 'Basic Permit Information', fields: ['permitType', 'title', 'riskLevel', 'plannedStartAt', 'plannedEndAt', 'siteId'] },
  { title: 'Work Location & Equipment', fields: ['areaId', 'locationDescription', 'equipmentTag'] },
  { title: 'Work Description & Job Scope', fields: ['detailedWorkDescription', 'workMethod', 'energyElectrical'] },
  { title: 'Permit Type Specific Requirements', fields: ['permitType'] },
  { title: 'Isolation / LOTO Plan', fields: ['isolationRequired', 'isolationPoints'] },
  { title: 'Gas Test Plan', fields: ['gasTestRequired', 'gasTester', 'instrumentCalibrationDate'] },
  { title: 'Workforce & Contractors', fields: ['permitHolder', 'performingAuthority', 'areaAuthority', 'workers'] },
  { title: 'Attachments & Supporting Documents', fields: ['attachments'] },
  { title: 'Review & Submit', fields: [] }
] as const;

export function PermitCreateWizard() {
  const router = useRouter();
  const toast = useMutationToast();
  const context = usePermitContext();
  const createPermit = useCreatePermit();
  const methods = useForm<PermitCreateValues>({
    resolver: zodResolver(permitCreateSchema),
    defaultValues: defaultPermitCreateValues(),
    mode: 'onBlur'
  });
  const values = useWatch({ control: methods.control }) as PermitCreateValues;
  const missing = missingRequirements(values);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex]!;
  const isLast = stepIndex === steps.length - 1;

  function setStep(index: number) {
    setStepIndex(Math.max(0, Math.min(steps.length - 1, index)));
  }

  async function next() {
    const ok = await methods.trigger(step.fields as any, { shouldFocus: true });
    if (!ok) {
      toast.warning('Complete required fields', 'Fix the highlighted fields before moving to the next step.');
      return;
    }
    setStep(stepIndex + 1);
  }

  function previous() {
    setStep(stepIndex - 1);
  }

  async function saveDraft() {
    const snapshot = methods.getValues();
    const minimumMissing = [
      !snapshot.permitType && 'Permit Type required',
      !snapshot.title && 'Title required',
      !snapshot.siteId && 'Site required',
      !snapshot.plannedStartAt && 'Start date required',
      !snapshot.plannedEndAt && 'End date required',
      !snapshot.riskLevel && 'Risk level required'
    ].filter(Boolean) as string[];
    if (minimumMissing.length) {
      toast.warning('Draft needs minimum fields', minimumMissing.join(', '));
      return;
    }
    try {
      const permit = await createPermit.mutateAsync({ values: snapshot, mode: 'draft' });
      toast.success('Draft saved', `${permit.permit_number} is saved as a PTW draft.`);
      router.push(`/ptw/${permit.id}`);
    } catch (error) {
      toast.error('Save Draft failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  const submitForApproval = methods.handleSubmit(async (formValues) => {
    try {
      const permit = await createPermit.mutateAsync({ values: formValues, mode: 'submit' });
      toast.success('Permit submitted for approval', `${permit.permit_number} workflow has started.`);
      router.push(`/ptw/${permit.id}`);
    } catch (error) {
      toast.error('Submit for Approval failed', error instanceof Error ? error.message : 'Request failed');
    }
  }, () => {
    toast.error('Submit blocked', 'Review the missing requirements checklist and highlighted fields.');
  });

  function cancel() {
    router.push('/ptw');
  }

  return (
    <FormProvider {...methods}>
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <header className="rounded-xl border border-cyan-300/10 bg-[#081727] p-5 shadow-2xl shadow-black/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-blue-300"><ShieldCheck size={18} /> Permit to Work</div>
              <h1 className="mt-2 text-2xl font-bold text-white">Create New Permit</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">Multi-step wizard for Basic Permit Information, Work Location & Equipment, Work Description & Job Scope, Permit Type Specific Requirements, Isolation / LOTO Plan, Gas Test Plan, Workforce & Contractors, Attachments & Supporting Documents, and Review & Submit.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="ptw-toolbar-button" onClick={cancel}><X size={15} /> Cancel</button>
              <button type="button" className="ptw-toolbar-button" onClick={saveDraft} disabled={createPermit.isPending}><Save size={15} /> Save Draft</button>
            </div>
          </div>
          <Stepper active={stepIndex} onSelect={setStep} />
        </header>

        {context.isLoading ? (
          <div className="rounded-xl border border-cyan-300/10 bg-[#0b1d31] p-5 text-sm text-slate-300"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading permit context from API...</div>
        ) : null}
        {context.isError ? (
          <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100"><AlertCircle className="mr-2 inline h-4 w-4" /> Unable to load some PTW context from API. The form remains available, but equipment search and active-permit preview may be limited.</div>
        ) : null}

        {stepIndex === 0 ? <PermitBasicInfoStep /> : null}
        {stepIndex === 1 ? <PermitLocationEquipmentStep equipment={context.equipment.data ?? []} activePermits={context.activePermits.data ?? []} /> : null}
        {stepIndex === 2 ? <PermitWorkDescriptionStep /> : null}
        {stepIndex === 3 ? <PermitTypeRequirementsStep /> : null}
        {stepIndex === 4 ? <PermitIsolationPlanStep /> : null}
        {stepIndex === 5 ? <PermitGasTestPlanStep /> : null}
        {stepIndex === 6 ? <PermitWorkforceStep /> : null}
        {stepIndex === 7 ? <PermitAttachmentsStep /> : null}
        {stepIndex === 8 ? <PermitReviewSubmitStep onSaveDraft={saveDraft} onSubmitForApproval={submitForApproval} onCancel={cancel} isSaving={createPermit.isPending} /> : null}

        <footer className="sticky bottom-0 z-20 rounded-xl border border-cyan-300/10 bg-[#06111f]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-400">
              Step {stepIndex + 1} of {steps.length}: <span className="font-semibold text-slate-100">{step.title}</span>
              <span className="ml-3 text-amber-200">{missing.length ? `${missing.length} missing before submit` : 'Ready for submit validation'}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" className="ptw-toolbar-button" onClick={previous} disabled={stepIndex === 0 || createPermit.isPending}><ArrowLeft size={15} /> Previous</button>
              {!isLast ? (
                <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500" onClick={next}>Next <ArrowRight className="ml-2 inline h-4 w-4" /></button>
              ) : (
                <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500 disabled:opacity-50" onClick={submitForApproval} disabled={createPermit.isPending}>
                  {createPermit.isPending ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <Check className="mr-2 inline h-4 w-4" />} Submit for Approval
                </button>
              )}
            </div>
          </div>
        </footer>
      </form>
    </FormProvider>
  );
}

function Stepper({ active, onSelect }: { active: number; onSelect: (index: number) => void }) {
  return (
    <div className="mt-5 grid gap-2 md:grid-cols-3 xl:grid-cols-9">
      {steps.map((item, index) => (
        <button
          key={item.title}
          type="button"
          onClick={() => onSelect(index)}
          className={`rounded-lg border px-3 py-2 text-left text-xs transition ${index === active ? 'border-blue-400 bg-blue-600/20 text-white' : index < active ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-cyan-300/10 bg-black/10 text-slate-400 hover:border-cyan-300/30 hover:text-slate-100'}`}
        >
          <div className="font-bold">{index + 1}</div>
          <div className="mt-1 line-clamp-2">{item.title}</div>
        </button>
      ))}
    </div>
  );
}
