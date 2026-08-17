'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { auditPlanService } from '../services/audit-plan.service';
import { useAuditPlanMutations } from '../hooks/useAuditPlanMutations';
import { AuditCard, AuditButton, AuditErrorState } from '../shared/AuditUi';
import { PlanIdentitySection } from './sections/PlanIdentitySection';
import { PlanProgramLinkSection } from './sections/PlanProgramLinkSection';
import { PlanScopeSection } from './sections/PlanScopeSection';
import { PlanStandardsSection } from './sections/PlanStandardsSection';
import { PlanModulesSection } from './sections/PlanModulesSection';
import { PlanTeamSection } from './sections/PlanTeamSection';
import { PlanScheduleSection } from './sections/PlanScheduleSection';
import { PlanReadinessConflictsSection } from './sections/PlanReadinessConflictsSection';
import type { AuditPlanDetail } from '../types/audit-plan.types';

const steps = ['Plan Identity','Audit Program Link','Scope','Standards / Regulations','Modules Covered','Audit Team','Schedule / Dates','Readiness / Conflicts','Review & Save'];
const identityFields: Array<[string, string]> = [['planTitle','Plan title'],['planCode','Plan code'],['auditType','Audit type'],['criticality','Criticality']];

export function AuditPlanForm({ existing }: { existing: AuditPlanDetail | undefined }) {
  const router = useRouter();
  const context = useQuery({ queryKey: ['audit','plans','context'], queryFn: auditPlanService.context });
  const mutations = useAuditPlanMutations();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Record<string, any>>({ planCategory: 'Program Audit', criticality: 'Medium', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, copyProgramConfiguration: true });

  useEffect(() => {
    if (!existing?.plan) return;
    const p = existing.plan;
    setForm({ planTitle: p.plan_title, planCode: p.plan_code, description: p.description, auditType: p.audit_type, planCategory: p.plan_category, criticality: p.criticality, programId: p.program_id, standaloneAudit: p.standalone_audit, standaloneReason: p.standalone_reason, auditObjective: p.audit_objective, auditCriteria: p.audit_criteria, plannedStartAt: local(p.planned_start_at), plannedEndAt: local(p.planned_end_at), timezone: p.timezone, auditLocation: p.audit_location, auditMode: p.audit_mode, leadAuditorUserId: p.lead_auditor_user_id, ownerUserId: p.owner_user_id, reviewerUserId: p.reviewer_user_id });
  }, [existing]);

  const set = (key: string, value: any) => { setForm((current) => ({ ...current, [key]: value })); setError(''); };
  const validate = () => {
    if (step === 0) { const missing = identityFields.filter(([key]) => !form[key]).map(([, label]) => label); if (missing.length) return `Missing required fields: ${missing.join(', ')}`; }
    if (step === 1 && !form.programId && !form.standaloneAudit) return 'Select an Audit Program or choose standalone audit.';
    if (step === 1 && form.standaloneAudit && !form.standaloneReason) return 'Standalone reason is required.';
    return '';
  };
  const next = () => { const reason = validate(); if (reason) return setError(reason); setStep((current) => Math.min(steps.length - 1, current + 1)); };
  const save = async () => {
    const reason = validate(); if (reason && step < 2) return setError(reason);
    try { const result = existing?.plan ? await mutations.update.mutateAsync({ id: existing.plan.id, payload: form }) : await mutations.create.mutateAsync(form); router.push(`/audit-compliance/plans/${result.plan.id}`); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save audit plan.'); }
  };
  const busy = mutations.create.isPending || mutations.update.isPending;
  if (context.error) return <AuditErrorState message={context.error} />;

  return <div className="space-y-5"><div className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">{steps.map((label,index)=><button key={label} onClick={()=>setStep(index)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${step===index?'bg-primary text-white':'text-[var(--psm-muted)]'}`}>{index+1}. {label}</button>)}</div>{error?<div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>:null}<AuditCard title={steps[step]}>{step===0?<PlanIdentitySection form={form} set={set}/>:step===1?<PlanProgramLinkSection form={form} set={set} programs={context.data?.programs ?? []}/>:step===2?<PlanScopeSection/>:step===3?<PlanStandardsSection/>:step===4?<PlanModulesSection/>:step===5?<PlanTeamSection form={form} set={set} users={context.data?.users ?? []}/>:step===6?<PlanScheduleSection form={form} set={set}/>:step===7?<PlanReadinessConflictsSection/>:<Review form={form}/>}</AuditCard><footer className="flex flex-wrap justify-between gap-3"><AuditButton variant="secondary" onClick={()=>setStep((x)=>Math.max(0,x-1))} disabled={step===0} title="Already at the first step.">Back</AuditButton><div className="flex gap-2"><AuditButton variant="secondary" onClick={save} disabled={busy} title={busy?'Saving is in progress.':'Save this plan as a draft.'}>{busy?'Saving…':'Save Draft'}</AuditButton>{step<steps.length-1?<AuditButton onClick={next}>Next</AuditButton>:<AuditButton onClick={save} disabled={busy} title={busy?'Saving is in progress.':'Create or update this audit plan.'}>{existing?'Save Changes':'Create Audit Plan'}</AuditButton>}</div></footer></div>;
}

function Review({ form }: { form: Record<string, any> }) { return <dl className="grid gap-3 md:grid-cols-2">{Object.entries(form).filter(([,value])=>value!==''&&value!==undefined).map(([key,value])=><div key={key} className="rounded-lg bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">{key}</dt><dd className="mt-1 font-medium">{String(value)}</dd></div>)}</dl>; }
function local(value?: string | null) { return value ? new Date(value).toISOString().slice(0,16) : ''; }
