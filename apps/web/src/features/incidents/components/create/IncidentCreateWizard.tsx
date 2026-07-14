'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIncidentCreateContext } from '../../hooks/useIncidentCreateContext';
import { useIncidentCreateWizard } from '../../hooks/useIncidentCreateWizard';
import { useIncidentDraft, useIncidentDraftMutations } from '../../hooks/useIncidentDraft';
import { useIncidentFollowupRecommendations } from '../../hooks/useIncidentFollowupRecommendations';
import { useIncidentPsmPseClassification } from '../../hooks/useIncidentPsmPseClassification';
import { useIncidentRiskCalculation } from '../../hooks/useIncidentRiskMatrix';
import { useIncidentSubmit } from '../../hooks/useIncidentSubmit';
import { incidentCreateService } from '../../services/incident-create.service';
import { IncidentDraftSaveStatus } from './IncidentDraftSaveStatus';
import { IncidentSubmitSuccessDialog } from './IncidentSubmitSuccessDialog';
import { IncidentWizardFooter } from './IncidentWizardFooter';
import { IncidentWizardHeader } from './IncidentWizardHeader';
import { IncidentWizardStepper } from './IncidentWizardStepper';
import { StateBanner } from './FormBits';
import { ActualSeverityStep } from './steps/ActualSeverityStep';
import { AssetEquipmentChemicalStep } from './steps/AssetEquipmentChemicalStep';
import { EventDescriptionStep } from './steps/EventDescriptionStep';
import { ImmediateActionsStep } from './steps/ImmediateActionsStep';
import { InitialEvidenceStep } from './steps/InitialEvidenceStep';
import { InvestigationFollowupStep } from './steps/InvestigationFollowupStep';
import { LocationTimeStep } from './steps/LocationTimeStep';
import { PeopleInjuryExposureStep } from './steps/PeopleInjuryExposureStep';
import { PotentialSeverityRiskStep } from './steps/PotentialSeverityRiskStep';
import { PsmPseClassificationStep } from './steps/PsmPseClassificationStep';
import { ReportTypeBasicInfoStep } from './steps/ReportTypeBasicInfoStep';
import { ReviewSubmitStep } from './steps/ReviewSubmitStep';

export function IncidentCreateWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const draftIdFromUrl = params.get('draftId') ?? undefined;
  const contextQuery = useIncidentCreateContext();
  const draftQuery = useIncidentDraft(draftIdFromUrl);
  const draftMutations = useIncidentDraftMutations();
  const riskMutation = useIncidentRiskCalculation();
  const classificationMutation = useIncidentPsmPseClassification();
  const followupMutation = useIncidentFollowupRecommendations();
  const submitMutation = useIncidentSubmit();
  const wizard = useIncidentCreateWizard();
  const [draftId, setDraftId] = useState<string | undefined>(draftIdFromUrl);
  const [validation, setValidation] = useState<any>(null);
  const [success, setSuccess] = useState<any>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (draftQuery.data?.draft_json) {
      wizard.setValues(draftQuery.data.draft_json);
      wizard.setStep(draftQuery.data.current_step ?? 1);
      setDraftId(draftQuery.data.id);
      wizard.setDirty(false);
    }
  }, [draftQuery.data]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!wizard.dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [wizard.dirty]);

  if (contextQuery.isLoading) return <State text="Loading create incident wizard context..." />;
  if (contextQuery.isError) return <State tone="error" text="Unable to load create wizard context. Check incidents.create permission, API availability, and migrations." />;
  
  // Guard clause added here to prevent the crash if data comes back empty/falsy
  if (!contextQuery.data) return <State tone="error" text="Unable to build application context. No data returned from authorization endpoints." />;
  
  const context = contextQuery.data;
  if (!context.permissions?.canCreate) return <State tone="error" text="Permission denied. Missing incidents.create permission." />;

  const update = (patch: any) => wizard.update(patch);
  const values: any = { reportedBy: context.currentUser?.id, ...wizard.values };
  const busy = draftMutations.create.isPending || draftMutations.update.isPending || submitMutation.isPending;
  const calculating = riskMutation.isPending || classificationMutation.isPending || followupMutation.isPending;
  const saveDraft = () => {
    const payload = { data: values, currentStep: wizard.step, siteId: values.siteId, companyId: values.companyId };
    const mutation = draftId ? draftMutations.update : draftMutations.create;
    const variables: any = draftId ? { id: draftId, values: payload } : payload;
    mutation.mutate(variables, { onSuccess: (row: any) => { setDraftId(row.id); wizard.setDirty(false); setNotice('Draft saved.'); }, onError: (e: any) => setNotice(e.message ?? 'Draft save failed') });
  };
  const recalc = () => {
    riskMutation.mutate(values);
    classificationMutation.mutate(values);
    followupMutation.mutate(values);
  };
  const localStepErrors = () => {
    const requiredByStep: Record<number, Array<[string, string]>> = {
      1: [['eventType', 'Event type'], ['title', 'Incident title'], ['shortDescription', 'Short description']],
      2: [['siteId', 'Site'], ['eventDateTime', 'Event date/time']],
      3: [['detailedDescription', 'Detailed description']],
      6: [['actualSeverity', 'Actual severity']],
      7: [['potentialSeverity', 'Potential severity']]
    };
    return (requiredByStep[wizard.step] ?? [])
      .filter(([field]) => !values[field])
      .map(([field, label]) => ({ field, message: `${label} is required before continuing.` }));
  };
  const next = async () => {
    setValidation(null);
    const localErrors = localStepErrors();
    if (localErrors.length) {
      setValidation({ valid: false, errors: localErrors });
      return;
    }
    if ([7, 8, 11].includes(wizard.step)) recalc();
    wizard.setStep(Math.min(12, wizard.step + 1));
    incidentCreateService.validate({ ...values, finalSubmit: false })
      .then((result) => setValidation(result?.valid ? null : result))
      .catch((e) => setValidation({ valid: false, errors: [{ field: 'backend', message: e.message ?? 'Backend validation failed.' }] }));
  };
  const submit = async () => {
    setValidation(null);
    setNotice('Creating incident...');
    submitMutation.mutate(values, {
      onSuccess: (r) => {
        wizard.setDirty(false);
        setSuccess(r);
        setNotice(`Incident ${r?.incidentNumber ?? ''} created.`);
        if (r?.redirectTo) router.push(r.redirectTo);
      },
      onError: (e: any) => {
        const message = e?.message ?? 'Submit failed';
        setNotice(message);
        setValidation({ valid: false, errors: [{ field: 'submit', message }] });
      }
    });
  };
  const common = { values, update, context, draftId, risk: riskMutation.data, classification: classificationMutation.data, followups: followupMutation.data, validation };
  const stepNode = [
    <ReportTypeBasicInfoStep key={1} {...common} />,
    <LocationTimeStep key={2} {...common} />,
    <EventDescriptionStep key={3} {...common} />,
    <PeopleInjuryExposureStep key={4} {...common} />,
    <AssetEquipmentChemicalStep key={5} {...common} />,
    <ActualSeverityStep key={6} {...common} />,
    <PotentialSeverityRiskStep key={7} {...common} />,
    <PsmPseClassificationStep key={8} {...common} />,
    <ImmediateActionsStep key={9} {...common} />,
    <InitialEvidenceStep key={10} {...common} />,
    <InvestigationFollowupStep key={11} {...common} />,
    <ReviewSubmitStep key={12} {...common} />
   ][wizard.step - 1];

  return <main className="space-y-4 pb-8 text-slate-900 dark:text-slate-100"><style jsx global>{`.lopa-button-primary{display:inline-flex;align-items:center;gap:.45rem;border-radius:.55rem;background:#2563eb;padding:.58rem .85rem;font-size:.82rem;font-weight:700;color:white}.lopa-button-secondary{display:inline-flex;align-items:center;gap:.45rem;border-radius:.55rem;border:1px solid rgba(103,232,249,.18);padding:.55rem .8rem;font-size:.82rem;font-weight:700;color:inherit}`}</style><IncidentWizardHeader dirty={wizard.dirty} context={context} />{notice ? <StateBanner tone={notice.toLowerCase().includes('fail') || notice.toLowerCase().includes('error') || notice.toLowerCase().includes('rejected') ? 'error' : 'info'}>{notice}</StateBanner> : null}{calculating ? <StateBanner>Updating risk/classification recommendations in the background. You can continue.</StateBanner> : null}{draftQuery.isLoading ? <StateBanner>Draft loading...</StateBanner> : null}<IncidentWizardStepper steps={wizard.steps} step={wizard.step} completed={wizard.completed} onStep={wizard.setStep} /><div className="flex items-center justify-between"><IncidentDraftSaveStatus draft={draftId ? { id: draftId, last_saved_at: new Date().toISOString() } : undefined} saving={draftMutations.create.isPending || draftMutations.update.isPending} error={(draftMutations.create.error as Error | null)?.message ?? (draftMutations.update.error as Error | null)?.message ?? null} />{context.drafts?.length ? <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-cyan-300/10 dark:bg-[#06111f]" onChange={(e) => e.target.value && router.push(`/incidents/new?draftId=${e.target.value}`)} defaultValue=""><option value="">Resume draft...</option>{context.drafts.map((d: any) => <option key={d.id} value={d.id}>Draft step {d.current_step} - {new Date(d.updated_at).toLocaleString()}</option>)}</select> : null}</div>{validation?.errors?.length ? <StateBanner tone="warn"><b>Validation notice</b><ul className="mt-1 list-disc pl-5">{validation.errors.map((e: any) => <li key={`${e.field}-${e.message}`}>{e.message}</li>)}</ul></StateBanner> : null}{!context.riskMatrix?.configured ? <StateBanner tone="warn"><b>Missing risk matrix config.</b> You can continue. Risk score will be <b>Not Determined</b>, investigation priority will be <b>Pending Review</b>, and severity review will be required. <span className="block text-xs">Action: Request Severity Review. Admin: Configure company/site incident risk matrix.</span></StateBanner> : null}{!context.pseThresholdConfig?.configured ? <StateBanner tone="warn"><b>Missing PSE threshold config.</b> You can continue. API RP 754 tier will be <b>Not Determined</b>, PSE status will be <b>Pending Review</b>, and PSM/PSE review will be required. <span className="block text-xs">Action: Request PSM/PSE Review. Admin: Configure company/site PSE threshold settings.</span></StateBanner> : null}{stepNode}<IncidentWizardFooter step={wizard.step} busy={busy} canSaveDraft={context.permissions?.canSaveDraft || context.permissions?.canCreate} canSubmit={context.permissions?.canSubmit || context.permissions?.canCreate} disabledReason="Missing incidents.submit permission" onBack={() => wizard.setStep(Math.max(1, wizard.step - 1))} onNext={next} onSaveDraft={saveDraft} onSubmit={submit} /><IncidentSubmitSuccessDialog result={success} onAnother={() => { setSuccess(null); wizard.setValues({ reportedBy: context.currentUser?.id }); wizard.setStep(1); }} onOpen={() => router.push(success?.redirectTo ?? `/incidents/${success?.incidentId}`)} /></main>;
}

function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) {
  return <main className={`rounded-xl border p-6 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-700 dark:text-red-100' : 'border-cyan-300/10 bg-[#071525] text-slate-400'}`}>{text}</main>;
}
