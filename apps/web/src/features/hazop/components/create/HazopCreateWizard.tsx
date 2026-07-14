'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ClipboardList, Factory, GitBranch, Layers3, Link2, Plus, Settings2, ShieldAlert, Users } from 'lucide-react';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { useHazopContext, useHazopMutations } from '../../hooks/useHazop';

const steps = [
  'Basic Study Information',
  'Scope & Location',
  'Linked Records',
  'Team Members',
  'Risk Matrix',
  'Method Settings',
  'Node Preview / Initial Nodes',
  'Review & Create'
];

const defaultSeverityLevels = ['1 - Negligible', '2 - Minor', '3 - Moderate', '4 - Major', '5 - Catastrophic'];
const defaultLikelihoodLevels = ['1 - Rare', '2 - Unlikely', '3 - Possible', '4 - Likely', '5 - Frequent'];
const defaultRiskColors = { Low: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };

export function HazopCreateWizard() {
  const router = useRouter();
  const context = useHazopContext();
  const permissions = useMyPermissions();
  const mutations = useHazopMutations();
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState<Record<string, any>>({
    studyType: 'HAZOP',
    priority: 'Medium',
    revalidationIntervalMonths: 60,
    teamMembers: [],
    linkedRecords: [],
    initialNodes: [],
    equipmentTags: [],
    pidReferences: [],
    relatedChemicals: [],
    settings: {
      riskMatrixSource: 'Company Default',
      guidewordSet: 'Standard HAZOP',
      parameterSet: 'Standard Parameters',
      riskMethod: '5x5 Matrix',
      severityLevels: defaultSeverityLevels,
      likelihoodLevels: defaultLikelihoodLevels,
      riskColors: defaultRiskColors,
      acceptanceCriteria: 'High and Critical scenarios require recommendation or formal acceptance.',
      lopaTriggerThreshold: 'Critical',
      recommendationWorkflow: 'Universal Action Engine',
      approvalWorkflow: 'Standard HAZOP Approval',
      studySessionPlan: 'Plan sessions by process node and operating mode.',
      reportTemplate: 'Standard HAZOP Report',
      revalidationPolicy: '5 year revalidation'
    }
  });
  const data = context.data ?? {};
  const grantedPermissions = permissions.data ?? [];
  const canCreate = grantedPermissions.includes('hazop.create') || grantedPermissions.includes('hazop:manage');
  const selectedSiteId = form.siteId;
  const selectedCompanyId = form.companyId;
  const units = useMemo(() => (data.units ?? []).filter((unit: any) => !selectedSiteId || unit.siteId === selectedSiteId), [data.units, selectedSiteId]);
  const areas = useMemo(() => (data.areas ?? []).filter((area: any) => !form.unitId || area.unitId === form.unitId), [data.areas, form.unitId]);
  const equipment = useMemo(() => (data.equipment ?? []).filter((item: any) => !selectedSiteId || item.siteId === selectedSiteId), [data.equipment, selectedSiteId]);
  const stepErrors = validateStep(step, form);
  const allErrors = steps.flatMap((_, index) => validateStep(index, form));
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const setSettings = (key: string, value: unknown) => setForm((current) => ({ ...current, settings: { ...(current.settings ?? {}), [key]: value } }));
  const next = () => {
    setAttempted(true);
    if (stepErrors.length) return;
    setAttempted(false);
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };
  const submit = async (mode: 'draft' | 'create' | 'start-preparation') => {
    setAttempted(true);
    setServerError('');
    const requiredErrors = mode === 'draft' ? validateDraft(form) : allErrors;
    if (requiredErrors.length) return;
    try {
      const study = await mutations.create.mutateAsync({ ...form, createMode: mode });
      router.push(`/hazop/${study.id}`);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to create HAZOP/PHA study.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--psm-bg)] p-4 text-[var(--psm-text)] lg:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create HAZOP / PHA Study</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Controlled study setup with real selectors, backend numbering, audit history, and optional initial nodes.</p>
        </div>
        <button onClick={() => router.push('/hazop')} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Cancel</button>
      </div>

      <div className="mb-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--psm-muted)]"><span>Wizard progress</span><span>{progress}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--psm-surface-2)]"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
      </div>

      {context.isLoading ? <StateBand>Loading create context from API...</StateBand> : null}
      {context.isError ? <ErrorBand message="Unable to load HAZOP create context. Selectors may be empty until the API is available." /> : null}
      {serverError ? <ErrorBand message={serverError} /> : null}
      {!canCreate && !permissions.isLoading ? <ErrorBand message="You do not have hazop.create permission. Create actions are disabled." /> : null}

      <div className="grid gap-4 xl:grid-cols-[310px_1fr]">
        <aside className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
          {steps.map((label, index) => {
            const errors = validateStep(index, form);
            return (
              <button key={label} onClick={() => setStep(index)} className={`mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${step === index ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-current text-xs">{!errors.length && index < step ? <Check size={14} /> : index + 1}</span>
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {errors.length ? <span className="h-2 w-2 rounded-full bg-amber-400" /> : null}
              </button>
            );
          })}
        </aside>

        <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold">{steps[step]}</h2>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">Step {step + 1} of {steps.length}</p>
            </div>
            <StepIcon step={step} />
          </div>
          <div className="p-6">
            {attempted && stepErrors.length ? <ValidationSummary errors={stepErrors} /> : null}
            {step === 0 ? <BasicInfo form={form} set={set} data={data} /> : null}
            {step === 1 ? <ScopeLocation form={form} set={set} data={data} units={units} areas={areas} equipment={equipment} selectedCompanyId={selectedCompanyId} /> : null}
            {step === 2 ? <LinkedRecords form={form} set={set} setForm={setForm} data={data} /> : null}
            {step === 3 ? <TeamMembers form={form} set={set} setForm={setForm} data={data} /> : null}
            {step === 4 ? <RiskMatrix form={form} set={set} setSettings={setSettings} data={data} /> : null}
            {step === 5 ? <MethodSettings form={form} setSettings={setSettings} data={data} /> : null}
            {step === 6 ? <InitialNodes form={form} setForm={setForm} equipment={equipment} documents={data.documents ?? []} /> : null}
            {step === 7 ? <ReviewCreate form={form} data={data} errors={allErrors} /> : null}
          </div>
          <div className="flex flex-col gap-3 border-t border-[var(--psm-line)] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold disabled:opacity-40"><ArrowLeft size={16} /> Back</button>
            <div className="flex flex-wrap justify-end gap-2">
              {step < steps.length - 1 ? (
                <button onClick={next} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Continue <ArrowRight size={16} /></button>
              ) : (
                <>
                  <button disabled={!canCreate || mutations.create.isPending} onClick={() => submit('draft')} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold disabled:opacity-40">Save Draft</button>
                  <button disabled={!canCreate || mutations.create.isPending} onClick={() => submit('create')} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Create Study</button>
                  <button disabled={!canCreate || mutations.create.isPending} onClick={() => submit('start-preparation')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Create and Start Preparation</button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function BasicInfo({ form, set, data }: SectionProps) {
  return <Grid>
    <Field label="Study Title" required><input value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} className="input" placeholder="e.g. Alkylation Unit Feed Section HAZOP" /></Field>
    <Field label="Study Type" required><select value={form.studyType} onChange={(e) => set('studyType', e.target.value)} className="input">{(data.studyTypes ?? []).map((type: string) => <option key={type}>{type}</option>)}</select></Field>
    <Field label="Study Reason" required><select value={form.studyReason ?? ''} onChange={(e) => set('studyReason', e.target.value)} className="input"><option value="">Select reason</option><option>New process / facility</option><option>Periodic revalidation</option><option>MOC trigger</option><option>Incident learning</option><option>PSSR startup readiness</option><option>Regulatory / audit requirement</option></select></Field>
    <Field label="Priority" required><select value={form.priority ?? 'Medium'} onChange={(e) => set('priority', e.target.value)} className="input">{(data.priorities ?? ['Low', 'Medium', 'High', 'Critical']).map((priority: string) => <option key={priority}>{priority}</option>)}</select></Field>
    <Field label="Target Start Date"><input type="date" value={form.targetStartDate ?? ''} onChange={(e) => set('targetStartDate', e.target.value)} className="input" /></Field>
    <Field label="Target Completion Date" required><input type="date" value={form.targetCompletionDate ?? ''} onChange={(e) => set('targetCompletionDate', e.target.value)} className="input" /></Field>
    <Field label="Revalidation Interval"><select value={form.revalidationIntervalMonths ?? 60} onChange={(e) => set('revalidationIntervalMonths', Number(e.target.value))} className="input"><option value={36}>3 years</option><option value={60}>5 years</option><option value={84}>7 years</option><option value={120}>10 years</option></select></Field>
    <Field label="Study Owner / Leader" required><UserSelect value={form.studyLeaderId ?? ''} users={data.users ?? []} onChange={(value) => set('studyLeaderId', value)} /></Field>
    <Field label="Description"><textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} className="input min-h-28" /></Field>
  </Grid>;
}

function ScopeLocation({ form, set, data, units, areas, equipment }: SectionProps & { units: any[]; areas: any[]; equipment: any[]; selectedCompanyId?: string }) {
  return <div className="space-y-5">
    <Grid>
      <Field label="Company" required><select value={form.companyId ?? ''} onChange={(e) => set('companyId', e.target.value)} className="input"><option value="">Select company</option>{(data.companies ?? []).map((company: any) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field>
      <Field label="Site" required><select value={form.siteId ?? ''} onChange={(e) => set('siteId', e.target.value)} className="input"><option value="">Select site</option>{(data.sites ?? []).map((site: any) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></Field>
      <Field label="Unit"><select value={form.unitId ?? ''} onChange={(e) => set('unitId', e.target.value)} className="input"><option value="">Select unit</option>{units.map((unit: any) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></Field>
      <Field label="Area"><select value={form.areaId ?? ''} onChange={(e) => set('areaId', e.target.value)} className="input"><option value="">Select area</option>{areas.map((area: any) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></Field>
      <Field label="Process Section" required><input value={form.processSection ?? ''} onChange={(e) => set('processSection', e.target.value)} className="input" placeholder="e.g. iC4 Feed Section" /></Field>
      <Field label="Related Chemicals"><TokenInput values={form.relatedChemicals ?? []} onChange={(values) => set('relatedChemicals', values)} placeholder="Add chemical name" /></Field>
    </Grid>
    <SelectorPanel title="Equipment Tags" items={equipment} selected={form.equipmentTags ?? []} onChange={(values) => set('equipmentTags', values)} label={(item) => `${item.tag} - ${item.name}`} empty="No equipment available for selected site." />
    <SelectorPanel title="P&ID / Document References" items={data.documents ?? []} selected={form.pidReferences ?? []} onChange={(values) => set('pidReferences', values)} label={(item) => `${item.document_number ?? item.id} - ${item.title}`} empty="No documents/P&IDs available." />
    <Grid>
      <Field label="Scope Description" required><textarea value={form.scopeDescription ?? ''} onChange={(e) => set('scopeDescription', e.target.value)} className="input min-h-28" /></Field>
      <Field label="Out-of-Scope Description"><textarea value={form.outOfScopeDescription ?? ''} onChange={(e) => set('outOfScopeDescription', e.target.value)} className="input min-h-28" /></Field>
      <Field label="Boundaries" required><textarea value={form.boundaries ?? ''} onChange={(e) => set('boundaries', e.target.value)} className="input min-h-28" /></Field>
      <Field label="Assumptions"><textarea value={form.assumptions ?? ''} onChange={(e) => set('assumptions', e.target.value)} className="input min-h-28" /></Field>
      <Field label="Exclusions"><textarea value={form.exclusions ?? ''} onChange={(e) => set('exclusions', e.target.value)} className="input min-h-28" /></Field>
    </Grid>
  </div>;
}

function LinkedRecords({ form, set, setForm, data }: SectionProps & { setForm: any }) {
  return <div className="space-y-4">
    <Grid>
      <Field label="Link MOC"><RecordSelect records={data.mocs ?? []} value={form.linkedMocId ?? ''} onChange={(value) => set('linkedMocId', value)} numberKey="moc_number" titleKey="title" /></Field>
      <Field label="Link PSSR"><RecordSelect records={data.pssrs ?? []} value={form.linkedPssrId ?? ''} onChange={(value) => set('linkedPssrId', value)} numberKey="pssr_number" titleKey="title" /></Field>
      <Field label="Link PTW"><RecordSelect records={data.ptws ?? []} value={form.linkedPtwId ?? ''} onChange={(value) => set('linkedPtwId', value)} numberKey="permit_number" titleKey="work_description" /></Field>
      <Field label="Link Incident"><RecordSelect records={data.incidents ?? []} value={form.linkedIncidentId ?? ''} onChange={(value) => set('linkedIncidentId', value)} numberKey="incident_number" titleKey="title" /></Field>
      <Field label="Previous HAZOP/PHA"><RecordSelect records={data.previousStudies ?? []} value={form.previousHazopId ?? ''} onChange={(value) => set('previousHazopId', value)} numberKey="study_number" titleKey="title" /></Field>
    </Grid>
    <SelectorPanel title="Link Equipment" items={data.equipment ?? []} selected={form.equipmentTags ?? []} onChange={(values) => set('equipmentTags', values)} label={(item) => `${item.tag} - ${item.name}`} empty="No equipment available." />
    <SelectorPanel title="Link Documents / P&IDs" items={data.documents ?? []} selected={form.pidReferences ?? []} onChange={(values) => set('pidReferences', values)} label={(item) => `${item.document_number ?? item.id} - ${item.title}`} empty="No documents available." />
    <ManualLinkedRecordBuilder form={form} setForm={setForm} />
  </div>;
}

function TeamMembers({ form, set, setForm, data }: SectionProps & { setForm: any }) {
  return <div className="space-y-4">
    <Grid>
      <Field label="HAZOP Leader / Facilitator" required><UserSelect value={form.facilitatorId ?? ''} users={data.users ?? []} onChange={(value) => set('facilitatorId', value)} /></Field>
      <Field label="Scribe"><UserSelect value={form.scribeId ?? ''} users={data.users ?? []} onChange={(value) => set('scribeId', value)} /></Field>
    </Grid>
    <TeamRoleMatrix form={form} setForm={setForm} users={data.users ?? []} roles={data.teamRoles ?? []} />
  </div>;
}

function RiskMatrix({ form, set, setSettings, data }: SectionProps & { setSettings: (key: string, value: unknown) => void }) {
  const settings = form.settings ?? {};
  return <div className="space-y-5">
    <Grid>
      <Field label="Matrix Source" required><select value={settings.riskMatrixSource ?? 'Company Default'} onChange={(e) => setSettings('riskMatrixSource', e.target.value)} className="input"><option>Company Default</option><option>Site Default</option><option>Custom Study Matrix</option></select></Field>
      <Field label="Risk Matrix"><select value={form.riskMatrixId ?? ''} onChange={(e) => set('riskMatrixId', e.target.value)} className="input"><option value="">Default configured matrix</option>{(data.riskMatrices ?? []).map((matrix: any) => <option key={matrix.id} value={matrix.id}>{matrix.name}</option>)}</select></Field>
      <Field label="Acceptance Criteria" required><textarea value={settings.acceptanceCriteria ?? ''} onChange={(e) => setSettings('acceptanceCriteria', e.target.value)} className="input min-h-24" /></Field>
      <Field label="LOPA Trigger Threshold" required><select value={settings.lopaTriggerThreshold ?? 'Critical'} onChange={(e) => setSettings('lopaTriggerThreshold', e.target.value)} className="input"><option>High</option><option>Critical</option><option>High + Safety Critical Equipment</option><option>Custom Policy</option></select></Field>
    </Grid>
    <LevelEditor title="Severity Levels" values={settings.severityLevels ?? defaultSeverityLevels} onChange={(values) => setSettings('severityLevels', values)} />
    <LevelEditor title="Likelihood Levels" values={settings.likelihoodLevels ?? defaultLikelihoodLevels} onChange={(values) => setSettings('likelihoodLevels', values)} />
    <RiskColorEditor colors={settings.riskColors ?? defaultRiskColors} onChange={(colors) => setSettings('riskColors', colors)} />
  </div>;
}

function MethodSettings({ form, setSettings, data }: { form: any; setSettings: (key: string, value: unknown) => void; data: any }) {
  const settings = form.settings ?? {};
  return <Grid>
    <Field label="Guideword Set"><select value={settings.guidewordSet ?? ''} onChange={(e) => setSettings('guidewordSet', e.target.value)} className="input"><option>Standard HAZOP</option><option>Startup / Shutdown</option><option>Batch Process</option><option>Utility Systems</option></select></Field>
    <Field label="Parameter Set"><select value={settings.parameterSet ?? ''} onChange={(e) => setSettings('parameterSet', e.target.value)} className="input"><option>Standard Parameters</option><option>Flow / Pressure / Temperature / Level</option><option>Composition / Phase / Utilities</option><option>Custom Parameters</option></select></Field>
    <Field label="Node Template"><select value={settings.nodeTemplate ?? ''} onChange={(e) => setSettings('nodeTemplate', e.target.value)} className="input"><option value="">No template</option>{(data.templates ?? []).map((template: any) => <option key={template.id} value={template.name}>{template.name}</option>)}</select></Field>
    <Field label="Recommendation Workflow"><input value={settings.recommendationWorkflow ?? ''} onChange={(e) => setSettings('recommendationWorkflow', e.target.value)} className="input" /></Field>
    <Field label="Approval Workflow"><input value={settings.approvalWorkflow ?? ''} onChange={(e) => setSettings('approvalWorkflow', e.target.value)} className="input" /></Field>
    <Field label="Report Template"><input value={settings.reportTemplate ?? ''} onChange={(e) => setSettings('reportTemplate', e.target.value)} className="input" /></Field>
    <Field label="Study Session Plan"><textarea value={settings.studySessionPlan ?? ''} onChange={(e) => setSettings('studySessionPlan', e.target.value)} className="input min-h-24" /></Field>
    <Field label="Revalidation Policy"><textarea value={settings.revalidationPolicy ?? ''} onChange={(e) => setSettings('revalidationPolicy', e.target.value)} className="input min-h-24" /></Field>
  </Grid>;
}

function InitialNodes({ form, setForm, equipment, documents }: { form: any; setForm: any; equipment: any[]; documents: any[] }) {
  const [node, setNode] = useState<Record<string, any>>({ equipmentIds: [], pidReferences: [] });
  const add = () => {
    if (!node.title) return;
    setForm((current: any) => ({ ...current, initialNodes: [...(current.initialNodes ?? []), node] }));
    setNode({ equipmentIds: [], pidReferences: [] });
  };
  return <div className="space-y-5">
    <StateBand>Initial nodes are optional. You can skip this step and add nodes later from the study detail page.</StateBand>
    <Grid>
      <Field label="Node Title"><input value={node.title ?? ''} onChange={(e) => setNode({ ...node, title: e.target.value })} className="input" placeholder="e.g. 1.1 Feed Line" /></Field>
      <Field label="Design Intent"><input value={node.designIntent ?? ''} onChange={(e) => setNode({ ...node, designIntent: e.target.value })} className="input" /></Field>
      <Field label="Process Conditions"><textarea value={node.processConditions ?? ''} onChange={(e) => setNode({ ...node, processConditions: e.target.value })} className="input min-h-24" /></Field>
      <Field label="Node Boundaries"><textarea value={node.boundaries ?? ''} onChange={(e) => setNode({ ...node, boundaries: e.target.value })} className="input min-h-24" /></Field>
    </Grid>
    <SelectorPanel title="Node Equipment Tags" items={equipment} selected={node.equipmentIds ?? []} onChange={(values) => setNode({ ...node, equipmentIds: values })} label={(item) => `${item.tag} - ${item.name}`} empty="No equipment available." />
    <SelectorPanel title="Node P&ID References" items={documents} selected={node.pidReferences ?? []} onChange={(values) => setNode({ ...node, pidReferences: values })} label={(item) => `${item.document_number ?? item.id} - ${item.title}`} empty="No documents available." />
    <button onClick={add} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"><Plus size={16} /> Add Initial Node</button>
    <div className="grid gap-3 lg:grid-cols-2">{(form.initialNodes ?? []).map((item: any, index: number) => <Card key={`${item.title}-${index}`} title={item.title} lines={[item.designIntent, item.boundaries, `${item.equipmentIds?.length ?? 0} equipment links`, `${item.pidReferences?.length ?? 0} P&IDs`]} />)}</div>
  </div>;
}

function ReviewCreate({ form, data, errors }: { form: any; data: any; errors: string[] }) {
  return <div className="space-y-5">
    {errors.length ? <ValidationSummary errors={errors} /> : <StateBand>All required wizard fields are complete.</StateBand>}
    <div className="grid gap-4 xl:grid-cols-3">
      <Card title="Study Summary" icon={ShieldAlert} lines={[form.title, form.studyType, form.studyReason, `Priority: ${form.priority}`, `Revalidation: ${form.revalidationIntervalMonths} months`]} />
      <Card title="Scope Summary" icon={Factory} lines={[lookup(data.sites, form.siteId), lookup(data.units, form.unitId), lookup(data.areas, form.areaId), form.processSection, `${form.equipmentTags?.length ?? 0} equipment tags`, `${form.pidReferences?.length ?? 0} P&ID/document refs`]} />
      <Card title="Linked Records" icon={Link2} lines={[`MOC: ${lookup(data.mocs, form.linkedMocId, 'moc_number')}`, `PSSR: ${lookup(data.pssrs, form.linkedPssrId, 'pssr_number')}`, `PTW: ${lookup(data.ptws, form.linkedPtwId, 'permit_number')}`, `Incident: ${lookup(data.incidents, form.linkedIncidentId, 'incident_number')}`, `Manual links: ${form.linkedRecords?.length ?? 0}`]} />
      <Card title="Team Summary" icon={Users} lines={[`Leader: ${lookup(data.users, form.studyLeaderId, 'displayName')}`, `Facilitator: ${lookup(data.users, form.facilitatorId, 'displayName')}`, `Scribe: ${lookup(data.users, form.scribeId, 'displayName')}`, `${form.teamMembers?.length ?? 0} role assignments`]} />
      <Card title="Risk / Method" icon={Settings2} lines={[form.settings?.riskMatrixSource, form.settings?.lopaTriggerThreshold, form.settings?.guidewordSet, form.settings?.recommendationWorkflow, form.settings?.approvalWorkflow]} />
      <Card title="Initial Nodes" icon={Layers3} lines={[`${form.initialNodes?.length ?? 0} initial nodes`, form.initialNodes?.length ? 'Will be saved to HAZOP nodes' : 'Skipped; add later from detail page']} />
    </div>
  </div>;
}

function ManualLinkedRecordBuilder({ form, setForm }: { form: any; setForm: any }) {
  const [record, setRecord] = useState({ recordType: 'Document', recordId: '', title: '', linkReason: '' });
  const add = () => {
    if (!record.recordId) return;
    setForm((current: any) => ({ ...current, linkedRecords: [...(current.linkedRecords ?? []), record] }));
    setRecord({ recordType: 'Document', recordId: '', title: '', linkReason: '' });
  };
  return <section className="rounded-xl border border-[var(--psm-line)] p-4">
    <h3 className="mb-3 font-semibold">Manual Linked Record</h3>
    <div className="grid gap-3 lg:grid-cols-[180px_1fr_1fr_1fr_auto]">
      <select value={record.recordType} onChange={(e) => setRecord({ ...record, recordType: e.target.value })} className="input"><option>Document</option><option>Equipment</option><option>MOC</option><option>PSSR</option><option>PTW</option><option>Incident</option><option>Previous HAZOP</option></select>
      <input value={record.recordId} onChange={(e) => setRecord({ ...record, recordId: e.target.value })} className="input" placeholder="Record ID" />
      <input value={record.title} onChange={(e) => setRecord({ ...record, title: e.target.value })} className="input" placeholder="Title" />
      <input value={record.linkReason} onChange={(e) => setRecord({ ...record, linkReason: e.target.value })} className="input" placeholder="Link reason" />
      <button onClick={add} className="rounded-lg bg-primary px-4 text-white">Add</button>
    </div>
    <div className="mt-3 grid gap-2 md:grid-cols-2">{(form.linkedRecords ?? []).map((item: any, index: number) => <Card key={index} title={`${item.recordType} · ${item.recordId}`} lines={[item.title, item.linkReason]} />)}</div>
  </section>;
}

function TeamRoleMatrix({ form, setForm, users, roles }: { form: any; setForm: any; users: any[]; roles: string[] }) {
  const rows = roles.map((role) => (form.teamMembers ?? []).find((m: any) => m.role === role) ?? { role, required: ['HAZOP Leader / Facilitator', 'Scribe', 'Process Engineer', 'Operations', 'HSE', 'Approver'].includes(role), signoffRequired: ['HAZOP Leader / Facilitator', 'HSE', 'Approver'].includes(role) });
  const update = (role: string, patch: Record<string, any>) => {
    setForm((current: any) => {
      const others = (current.teamMembers ?? []).filter((m: any) => m.role !== role);
      const existing = rows.find((m: any) => m.role === role) ?? { role };
      const next = { ...existing, ...patch };
      return { ...current, teamMembers: [...others, next] };
    });
  };
  return <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
    <table className="w-full min-w-[900px] text-sm">
      <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="px-3 py-3 text-left">Role</th><th className="px-3 py-3 text-left">Assigned User</th><th className="px-3 py-3 text-left">Discipline</th><th className="px-3 py-3 text-left">Attendance Required</th><th className="px-3 py-3 text-left">Sign-off Required</th></tr></thead>
      <tbody>{rows.map((row: any) => <tr key={row.role} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3 font-semibold">{row.role}</td><td className="px-3 py-3"><UserSelect value={row.userId ?? ''} users={users} onChange={(value) => { const user = users.find((u) => u.id === value); update(row.role, { userId: value, name: user?.displayName ?? row.role, discipline: user?.title ?? row.discipline }); }} /></td><td className="px-3 py-3"><input value={row.discipline ?? ''} onChange={(e) => update(row.role, { discipline: e.target.value })} className="input" /></td><td className="px-3 py-3"><input type="checkbox" checked={Boolean(row.required)} onChange={(e) => update(row.role, { required: e.target.checked })} /></td><td className="px-3 py-3"><input type="checkbox" checked={Boolean(row.signoffRequired)} onChange={(e) => update(row.role, { signoffRequired: e.target.checked })} /></td></tr>)}</tbody>
    </table>
  </div>;
}

function SelectorPanel({ title, items, selected, onChange, label, empty }: { title: string; items: any[]; selected: string[]; onChange: (values: string[]) => void; label: (item: any) => string; empty: string }) {
  return <section className="rounded-xl border border-[var(--psm-line)] p-4">
    <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{title}</h3><span className="text-xs text-[var(--psm-muted)]">{selected.length} selected</span></div>
    {items.length ? <div className="grid max-h-56 gap-2 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">{items.map((item) => { const active = selected.includes(item.id); return <button key={item.id} onClick={() => onChange(active ? selected.filter((id) => id !== item.id) : [...selected, item.id])} className={`rounded-lg border p-3 text-left text-sm ${active ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]'}`}><div className="font-semibold">{label(item)}</div><div className="mt-1 text-xs text-[var(--psm-muted)]">{item.status ?? item.type ?? item.document_type}</div></button>; })}</div> : <Empty text={empty} />}
  </section>;
}

function LevelEditor({ title, values, onChange }: { title: string; values: string[]; onChange: (values: string[]) => void }) {
  return <section className="rounded-xl border border-[var(--psm-line)] p-4"><h3 className="mb-3 font-semibold">{title}</h3><div className="grid gap-2 md:grid-cols-5">{values.map((value, index) => <input key={index} value={value} onChange={(e) => onChange(values.map((item, itemIndex) => itemIndex === index ? e.target.value : item))} className="input" />)}</div></section>;
}

function RiskColorEditor({ colors, onChange }: { colors: Record<string, string>; onChange: (colors: Record<string, string>) => void }) {
  return <section className="rounded-xl border border-[var(--psm-line)] p-4"><h3 className="mb-3 font-semibold">Risk Colors</h3><div className="grid gap-3 md:grid-cols-4">{Object.entries(colors).map(([key, value]) => <label key={key} className="text-sm"><span className="mb-2 block text-[var(--psm-muted)]">{key}</span><div className="flex gap-2"><input type="color" value={value} onChange={(e) => onChange({ ...colors, [key]: e.target.value })} className="h-10 w-12 rounded border border-[var(--psm-line)] bg-transparent" /><input value={value} onChange={(e) => onChange({ ...colors, [key]: e.target.value })} className="input" /></div></label>)}</div></section>;
}

function TokenInput({ values, onChange, placeholder }: { values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  const add = () => { if (draft.trim()) { onChange([...values, draft.trim()]); setDraft(''); } };
  return <div><div className="flex gap-2"><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} className="input" placeholder={placeholder} /><button type="button" onClick={add} className="rounded-lg border border-[var(--psm-line)] px-3">Add</button></div><div className="mt-2 flex flex-wrap gap-2">{values.map((value) => <button key={value} onClick={() => onChange(values.filter((item) => item !== value))} className="rounded-full border border-[var(--psm-line)] px-3 py-1 text-xs">{value} x</button>)}</div></div>;
}

function UserSelect({ value, users, onChange }: { value: string; users: any[]; onChange: (value: string) => void }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="input"><option value="">Select user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.displayName} {user.title ? `- ${user.title}` : ''}</option>)}</select>;
}

function RecordSelect({ records, value, onChange, numberKey, titleKey }: { records: any[]; value: string; onChange: (value: string) => void; numberKey: string; titleKey: string }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="input"><option value="">None</option>{records.map((record) => <option key={record.id} value={record.id}>{record[numberKey] ?? record.id} - {record[titleKey] ?? record.title ?? record.status}</option>)}</select>;
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block text-sm"><span className="mb-2 block font-semibold text-[var(--psm-muted)]">{label}{required ? <span className="text-red-300"> *</span> : null}</span>{children}</label>;
}

function Card({ title, lines, icon: Icon }: { title: string; lines: any[]; icon?: any }) {
  return <div className="rounded-xl border border-[var(--psm-line)] p-4"><div className="mb-3 flex items-center gap-2 font-semibold">{Icon ? <Icon size={18} /> : null}{title}</div>{lines.filter(Boolean).length ? lines.filter(Boolean).map((line, index) => <div key={index} className="mb-1 text-sm text-[var(--psm-muted)]">{line}</div>) : <div className="text-sm text-[var(--psm-muted)]">None selected</div>}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">{text}</div>;
}

function ValidationSummary({ errors }: { errors: string[] }) {
  return <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100"><div className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> Missing required fields</div>{errors.map((error) => <div key={error}>- {error}</div>)}</div>;
}

function ErrorBand({ message }: { message: string }) {
  return <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{message}</div>;
}

function StateBand({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-muted)]">{children}</div>;
}

function StepIcon({ step }: { step: number }) {
  const icons = [ClipboardList, Factory, Link2, Users, ShieldAlert, Settings2, Layers3, GitBranch];
  const Icon = icons[step] ?? ClipboardList;
  return <div className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]"><Icon size={20} /></div>;
}

function validateDraft(form: Record<string, any>) {
  const errors = [];
  if (!form.title) errors.push('Study title is required');
  if (!form.studyType) errors.push('Study type is required');
  if (!form.siteId) errors.push('Site is required');
  return errors;
}

function validateStep(step: number, form: Record<string, any>) {
  const errors: string[] = [];
  if (step === 0) {
    if (!form.title) errors.push('Study title is required');
    if (!form.studyType) errors.push('Study type is required');
    if (!form.studyReason) errors.push('Study reason is required');
    if (!form.priority) errors.push('Priority is required');
    if (!form.targetCompletionDate) errors.push('Target completion date is required');
    if (!form.studyLeaderId) errors.push('Study owner / leader is required');
  }
  if (step === 1) {
    if (!form.companyId) errors.push('Company is required');
    if (!form.siteId) errors.push('Site is required');
    if (!form.processSection) errors.push('Process section is required');
    if (!form.scopeDescription) errors.push('Scope description is required');
    if (!form.boundaries) errors.push('Boundaries are required');
  }
  if (step === 3) {
    if (!form.facilitatorId) errors.push('HAZOP Leader / Facilitator is required');
    const requiredRoles = (form.teamMembers ?? []).filter((member: any) => member.required);
    if (requiredRoles.some((member: any) => !member.userId && !member.name)) errors.push('Required team roles must have assigned users or names');
  }
  if (step === 4) {
    if (!form.settings?.riskMatrixSource) errors.push('Risk matrix source is required');
    if (!form.settings?.acceptanceCriteria) errors.push('Acceptance criteria is required');
    if (!form.settings?.lopaTriggerThreshold) errors.push('LOPA trigger threshold is required');
  }
  return errors;
}

function lookup(records: any[] = [], id?: string, labelKey = 'name') {
  if (!id) return 'None';
  const record = records.find((item) => item.id === id);
  return record?.[labelKey] ?? record?.title ?? record?.name ?? id;
}

type SectionProps = {
  form: Record<string, any>;
  set: (key: string, value: unknown) => void;
  data: Record<string, any>;
};
