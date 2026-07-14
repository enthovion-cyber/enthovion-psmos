'use client';

import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, GitBranch, Loader2, Save, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useLopaCreateContext, useLopaCreateMutations, useLopaCreateTeamSuggestions, useLopaCreateUserSearch, useLopaHazopScenario } from '../../hooks/useLopa';
import { defaultLopaCreateValues, lopaCreateSchema } from '../../schemas/lopa.schema';
import type { LopaCreateValues } from '../../types/lopa.types';
import { LopaOwnerSelector } from './LopaOwnerSelector';

const steps = ['Creation Method', 'Basic Study Info', 'Source / Linked Scenario', 'Consequence Setup', 'Initiating Event Setup', 'Safeguard / IPL Import', 'Team / Ownership', 'Review & Create'];

export function LopaCreateWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useMutationToast();
  const context = useLopaCreateContext();
  const mutations = useLopaCreateMutations();
  const hazopScenarioId = params.get('hazopScenarioId') ?? undefined;
  const source = params.get('source');
  const hazopScenario = useLopaHazopScenario(hazopScenarioId);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<LopaCreateValues>(() => ({ ...defaultLopaCreateValues(), creationMethod: source === 'hazop' || hazopScenarioId ? 'hazop' : 'manual', source: source === 'hazop' || hazopScenarioId ? 'HAZOP/PHA' : 'Manual', studyType: source === 'hazop' || hazopScenarioId ? 'HAZOP-triggered LOPA' : 'New LOPA' }));

  useEffect(() => {
    const scenario = hazopScenario.data;
    if (!scenario) return;
    setValues((current): LopaCreateValues => ({
      ...current,
      creationMethod: 'hazop',
      source: 'HAZOP/PHA',
      studyType: 'HAZOP-triggered LOPA',
      hazopScenarioId: scenario.id,
      title: current.title || `${scenario.hazopNumber} ${scenario.deviation ?? 'scenario'} LOPA`,
      siteId: current.siteId || scenario.siteId || '',
      unitId: current.unitId || scenario.unitId,
      areaId: current.areaId || scenario.areaId,
      equipmentTag: current.equipmentTag || scenario.equipmentTag,
      consequence: { ...current.consequence, description: current.consequence.description || scenario.consequence, severity: current.consequence.severity || scenario.riskLevel, category: current.consequence.category || 'Process Safety' },
      initiatingEvent: { ...current.initiatingEvent, description: current.initiatingEvent.description || scenario.cause, eventCategory: current.initiatingEvent.eventCategory || 'HAZOP Cause' },
      importedSafeguards: current.importedSafeguards.length ? current.importedSafeguards : (scenario.safeguards ?? []).map((s: any) => ({ sourceSafeguardId: s.id, safeguardName: s.name ?? s.safeguard_name ?? s.description ?? 'Imported HAZOP safeguard', safeguardType: s.type ?? s.safeguard_type, description: s.description, proposedLopaUse: 'IPL Candidate', creditedAsIpl: false }))
    }) as LopaCreateValues);
  }, [hazopScenario.data]);

  const validation = useMemo(() => lopaCreateSchema.safeParse(values), [values]);
  const isSaving = mutations.create.isPending || mutations.saveDraft.isPending || mutations.createFromHazop.isPending;
  const selectedScenario = values.hazopScenarioId ? context.data?.hazopScenarios.find((item) => item.id === values.hazopScenarioId) ?? hazopScenario.data : undefined;

  function patch(patchValues: Partial<LopaCreateValues>) {
    setValues((current) => ({ ...current, ...patchValues }));
  }

  function updateNested<K extends 'consequence' | 'initiatingEvent'>(key: K, patchValues: Partial<LopaCreateValues[K]>) {
    setValues((current) => ({ ...current, [key]: { ...current[key], ...patchValues } }));
  }

  function next() {
    if (step === 1 && (!values.title || !values.studyType || !values.siteId || !values.ownerId)) {
      toast.warning('Complete basic study info', 'Title, study type, site, and owner are required.');
      return;
    }
    if (step === 2 && values.creationMethod === 'hazop' && !values.hazopScenarioId) {
      toast.warning('Select HAZOP scenario', 'Choose a LOPA-required HAZOP scenario before continuing.');
      return;
    }
    setStep((current) => Math.min(steps.length - 1, current + 1));
  }

  async function saveDraft() {
    if (!values.title || !values.siteId || !values.ownerId) {
      toast.warning('Draft needs minimum fields', 'Title, site, and owner are required before saving.');
      return;
    }
    try {
      const created = values.creationMethod === 'hazop' && values.hazopScenarioId ? await mutations.createFromHazop.mutateAsync({ ...values, hazopScenarioId: values.hazopScenarioId }) : await mutations.saveDraft.mutateAsync(values);
      toast.success('LOPA draft saved', `${created.lopaNumber} was saved.`);
      router.push('/lopa');
    } catch (error) {
      toast.error('Save draft failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  async function create(open: boolean, sendInvitations = false) {
    const unsavableTeam = values.teamMembers.filter((member) => member.required && !member.userId && !member.email);
    if (unsavableTeam.length) {
      toast.warning('Team role needs a user', `Select a user or email for: ${unsavableTeam.map((member) => member.role).join(', ')}`);
      return;
    }
    const parsed = lopaCreateSchema.safeParse(values);
    if (!parsed.success) {
      toast.warning('Complete required fields', parsed.error.issues.slice(0, 3).map((issue) => issue.message).join(', '));
      return;
    }
    try {
      const payload: LopaCreateValues = sendInvitations || values.sendInvitations ? { ...values, sendInvitations: true } : values;
      const created = payload.creationMethod === 'hazop' && payload.hazopScenarioId ? await mutations.createFromHazop.mutateAsync({ ...payload, hazopScenarioId: payload.hazopScenarioId }) : await mutations.create.mutateAsync(payload);
      toast.success(sendInvitations ? 'LOPA study created and invitations queued' : 'LOPA study created', `${created.lopaNumber} is ready.`);
      router.push(open ? `/lopa/${created.id}` : '/lopa');
    } catch (error) {
      toast.error('Create LOPA failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <main className="space-y-4 pb-8 text-slate-100">
      <style jsx global>{`
        .lopa-button-primary { display:inline-flex; align-items:center; gap:.45rem; border-radius:.55rem; background:#2563eb; padding:.58rem .85rem; font-size:.82rem; font-weight:700; color:white; }
        .lopa-button-secondary { display:inline-flex; align-items:center; gap:.45rem; border-radius:.55rem; border:1px solid rgba(103,232,249,.14); background:rgba(15,35,58,.9); padding:.55rem .8rem; font-size:.82rem; font-weight:700; color:#dbeafe; }
      `}</style>
      <header className="rounded-xl border border-cyan-300/10 bg-[#071525] p-5 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300"><ShieldCheck size={16} /> LOPA / SIL Management</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Create LOPA Study</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">Create manually or import a LOPA-required HAZOP/PHA scenario. Imported safeguards are saved as IPL candidates only until later validation.</p>
          </div>
          <div className="flex gap-2">
            <button className="lopa-button-secondary" onClick={() => router.push('/lopa')}>Cancel</button>
            <button className="lopa-button-secondary" onClick={saveDraft} disabled={isSaving}><Save size={15} /> Save Draft</button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          {steps.map((title, index) => (
            <button key={title} onClick={() => setStep(index)} className={`rounded-lg border p-3 text-left text-xs ${index === step ? 'border-blue-400/40 bg-blue-500/15 text-white' : index < step ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100' : 'border-cyan-300/10 bg-[#03101d] text-slate-400'}`}>
              <span className="mb-1 block font-bold">Step {index + 1}</span>{title}
            </button>
          ))}
        </div>
      </header>

      {context.isLoading ? <Panel><Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading LOPA context from API...</Panel> : null}
      {context.isError ? <Panel tone="error">Unable to load context. Check API permissions and database tables.</Panel> : null}

      {step === 0 ? <CreationMethodStep values={values} patch={patch} /> : null}
      {step === 1 ? <BasicInfoStep values={values} patch={patch} context={context.data} /> : null}
      {step === 2 ? <SourceStep values={values} patch={patch} context={context.data} selectedScenario={selectedScenario} loading={hazopScenario.isLoading} /> : null}
      {step === 3 ? <ConsequenceStep values={values} update={updateNested} /> : null}
      {step === 4 ? <InitiatingEventStep values={values} update={updateNested} /> : null}
      {step === 5 ? <SafeguardImportStep values={values} patch={patch} selectedScenario={selectedScenario} /> : null}
      {step === 6 ? <TeamStep values={values} patch={patch} context={context.data} /> : null}
      {step === 7 ? <ReviewStep values={values} validationOk={validation.success} selectedScenario={selectedScenario} context={context.data} /> : null}

      <footer className="sticky bottom-0 z-20 rounded-xl border border-cyan-300/10 bg-[#06111f]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-400">Step {step + 1} of {steps.length}: <span className="font-semibold text-slate-100">{steps[step]}</span></div>
          <div className="flex gap-2">
            <button className="lopa-button-secondary" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || isSaving}><ArrowLeft size={15} /> Previous</button>
            {step < steps.length - 1 ? <button className="lopa-button-primary" onClick={next}>Next <ArrowRight size={15} /></button> : (
              <>
                <button className="lopa-button-secondary" onClick={() => create(false)} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={15} />} Create LOPA</button>
                <button className="lopa-button-secondary" onClick={() => create(true, true)} disabled={isSaving}>Create + Send Invitations</button>
                <button className="lopa-button-primary" onClick={() => create(true)} disabled={isSaving}>Create & Open</button>
              </>
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}

function CreationMethodStep({ values, patch }: any) {
  const options: Array<[string, string, string]> = [
    ['manual', 'Create manually', 'Manual study not linked to a source record.'],
    ['hazop', 'Create from HAZOP/PHA scenario', 'Imports deviation, cause, consequence, safeguards, risk and links.'],
    ['moc', 'Create from MOC', 'Prepared source type for later integration.'],
    ['pssr', 'Create from PSSR', 'Prepared source type for later integration.'],
    ['incident', 'Create from Incident', 'Prepared source type for later integration.'],
    ['audit', 'Create from Audit', 'Prepared source type for later integration.'],
    ['revalidation', 'Create for Revalidation', 'Start a revalidation LOPA.']
  ];
  return <Panel title="Creation Method"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{options.map(([id, title, help]) => <button key={id} onClick={() => patch({ creationMethod: id, source: id === 'hazop' ? 'HAZOP/PHA' : title.replace('Create from ', '').replace('Create manually', 'Manual').replace('Create for ', '') })} className={`rounded-xl border p-4 text-left ${values.creationMethod === id ? 'border-blue-400/40 bg-blue-500/15' : 'border-cyan-300/10 bg-[#03101d]'}`}><div className="font-bold text-white">{title}</div><div className="mt-1 text-sm text-slate-400">{help}</div></button>)}</div><textarea value={values.notes ?? ''} onChange={(e) => patch({ notes: e.target.value })} className="mt-4 min-h-24 w-full rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm outline-none" placeholder="Notes (optional)" /></Panel>;
}

function BasicInfoStep({ values, patch, context }: any) {
  return <Panel title="Basic Study Info"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Field label="Study Title *" value={values.title} onChange={(title) => patch({ title })} /><Select label="Study Type *" value={values.studyType} onChange={(studyType) => patch({ studyType })} options={['New LOPA', 'HAZOP-triggered LOPA', 'MOC-triggered LOPA', 'PSSR-triggered LOPA', 'Incident-triggered LOPA', 'Revalidation LOPA', 'SIL verification support', 'Existing IPL review', 'Other']} /><Select label="Study Source *" value={values.source} onChange={(source) => patch({ source })} options={['Manual', 'HAZOP/PHA', 'MOC', 'PSSR', 'Incident', 'Audit', 'Revalidation']} /><Select label="Site *" value={values.siteId} onChange={(siteId) => patch({ siteId })} options={(context?.sites ?? []).map((s: any) => [s.id, s.name])} /><Select label="Unit" value={values.unitId ?? ''} onChange={(unitId) => patch({ unitId })} options={(context?.units ?? []).filter((u: any) => !values.siteId || u.siteId === values.siteId).map((u: any) => [u.id, u.name])} /><Select label="Area" value={values.areaId ?? ''} onChange={(areaId) => patch({ areaId })} options={(context?.areas ?? []).filter((a: any) => !values.unitId || a.unitId === values.unitId).map((a: any) => [a.id, a.name])} /><Field label="Equipment tag/system" value={values.equipmentTag ?? ''} onChange={(equipmentTag) => patch({ equipmentTag })} /><Select label="Facilitator" value={values.facilitatorId ?? ''} onChange={(facilitatorId) => patch({ facilitatorId })} options={(context?.users ?? []).filter((u: any) => u.active !== false).map((u: any) => [u.id, `${u.displayName || u.email}${u.jobTitle ? ` - ${u.jobTitle}` : ''}`])} /><Field label="Due date" type="date" value={values.dueDate ?? ''} onChange={(dueDate) => patch({ dueDate })} /><Field label="Revalidation due" type="date" value={values.revalidationDueDate ?? ''} onChange={(revalidationDueDate) => patch({ revalidationDueDate })} /><Select label="Priority" value={values.priority ?? 'Medium'} onChange={(priority) => patch({ priority })} options={['Low', 'Medium', 'High', 'Critical']} /></div><div className="mt-3"><LopaOwnerSelector value={values.ownerId} onChange={(ownerId) => patch({ ownerId })} users={context?.users ?? []} siteId={values.siteId} unitId={values.unitId} areaId={values.areaId} hazopScenarioId={values.hazopScenarioId} facilitatorId={values.facilitatorId} /></div><textarea value={values.description ?? ''} onChange={(e) => patch({ description: e.target.value })} className="mt-3 min-h-24 w-full rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm outline-none" placeholder="Study description" /></Panel>;
}

function SourceStep({ values, patch, context, selectedScenario, loading }: any) {
  return <Panel title="Source / Linked HAZOP Scenario">{values.creationMethod !== 'hazop' ? <div className="text-sm text-slate-400">Manual/source preparation selected. HAZOP scenario link is optional for Phase 1.</div> : <><Select label="LOPA-required HAZOP scenario" value={values.hazopScenarioId ?? ''} onChange={(hazopScenarioId) => patch({ hazopScenarioId })} options={(context?.hazopScenarios ?? []).map((s: any) => [s.id, `${s.hazopNumber} / ${s.nodeTitle ?? 'Node'} / ${s.deviation ?? s.consequence}`])} />{loading ? <div className="mt-3 text-sm text-slate-400">Loading source scenario...</div> : null}{selectedScenario ? <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm"><div className="mb-2 flex items-center gap-2 font-bold text-amber-100"><AlertTriangle size={16} /> IPL credit warning</div><p className="text-amber-100/80">HAZOP safeguards are imported as safeguard/IPL candidates only. IPL credit requires later validation in the LOPA workflow.</p><div className="mt-3 grid gap-2 md:grid-cols-2"><Info label="HAZOP" value={selectedScenario.hazopNumber} /><Info label="Deviation" value={selectedScenario.deviation} /><Info label="Cause" value={selectedScenario.cause} /><Info label="Consequence" value={selectedScenario.consequence} /></div></div> : null}</>}</Panel>;
}

function ConsequenceStep({ values, update }: any) {
  return <Panel title="Consequence Setup"><div className="grid gap-3 md:grid-cols-2"><textarea value={values.consequence.description ?? ''} onChange={(e) => update('consequence', { description: e.target.value })} className="min-h-32 rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm outline-none" placeholder="Consequence description" /><div className="grid gap-3"><Select label="Consequence category" value={values.consequence.category ?? ''} onChange={(category) => update('consequence', { category })} options={['', 'Fire', 'Explosion', 'Toxic Release', 'Environmental Release', 'Personnel Injury', 'Asset Damage', 'Business Interruption']} /><Select label="Severity" value={values.consequence.severity ?? ''} onChange={(severity) => update('consequence', { severity })} options={['', 'Low', 'Medium', 'High', 'Critical']} /><Field label="Impacted receptor" value={values.consequence.impactedReceptor ?? ''} onChange={(impactedReceptor) => update('consequence', { impactedReceptor })} /><Field label="Tolerable event frequency" type="number" value={values.consequence.tolerableEventFrequency ?? ''} onChange={(v) => update('consequence', { tolerableEventFrequency: Number(v) || null })} /><Field label="Risk criteria source" value={values.consequence.riskCriteriaSource ?? ''} onChange={(riskCriteriaSource) => update('consequence', { riskCriteriaSource })} /></div></div></Panel>;
}

function InitiatingEventStep({ values, update }: any) {
  return <Panel title="Initiating Event Setup"><div className="grid gap-3 md:grid-cols-2"><textarea value={values.initiatingEvent.description ?? ''} onChange={(e) => update('initiatingEvent', { description: e.target.value })} className="min-h-32 rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm outline-none" placeholder="Initiating event description" /><div className="grid gap-3"><Field label="Event category" value={values.initiatingEvent.eventCategory ?? ''} onChange={(eventCategory) => update('initiatingEvent', { eventCategory })} /><Field label="Frequency method" value={values.initiatingEvent.frequencyMethod ?? ''} onChange={(frequencyMethod) => update('initiatingEvent', { frequencyMethod })} /><Field label="Library event" value={values.initiatingEvent.libraryEvent ?? ''} onChange={(libraryEvent) => update('initiatingEvent', { libraryEvent })} /><Field label="Frequency per year" type="number" value={values.initiatingEvent.frequencyPerYear ?? ''} onChange={(v) => update('initiatingEvent', { frequencyPerYear: Number(v) || null })} /><Field label="Frequency source" value={values.initiatingEvent.frequencySource ?? ''} onChange={(frequencySource) => update('initiatingEvent', { frequencySource })} /></div></div></Panel>;
}

function SafeguardImportStep({ values, patch, selectedScenario }: any) {
  function addBlank() { patch({ importedSafeguards: [...values.importedSafeguards, { safeguardName: '', proposedLopaUse: 'IPL Candidate', creditedAsIpl: false }] }); }
  function update(index: number, field: string, value: any) { patch({ importedSafeguards: values.importedSafeguards.map((item: any, i: number) => i === index ? { ...item, [field]: value } : item) }); }
  return <Panel title="Initial Safeguard / IPL Import"><div className="mb-3 rounded-lg border border-amber-300/20 bg-amber-500/10 p-3 text-sm text-amber-100">Imported HAZOP safeguards are traceability candidates only. They are not credited IPLs until validation in a later phase.</div>{!values.importedSafeguards.length ? <div className="text-sm text-slate-400">No safeguards imported{selectedScenario ? ' from this scenario' : ''}.</div> : null}<div className="space-y-2">{values.importedSafeguards.map((item: any, index: number) => <div key={index} className="grid gap-2 rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 md:grid-cols-4"><Field label="Safeguard name" value={item.safeguardName} onChange={(v) => update(index, 'safeguardName', v)} /><Field label="Type" value={item.safeguardType ?? ''} onChange={(v) => update(index, 'safeguardType', v)} /><Select label="Proposed use" value={item.proposedLopaUse ?? 'IPL Candidate'} onChange={(v) => update(index, 'proposedLopaUse', v)} options={['Safeguard Only', 'IPL Candidate']} /><Field label="Notes" value={item.notes ?? ''} onChange={(v) => update(index, 'notes', v)} /></div>)}</div><button className="lopa-button-secondary mt-3" onClick={addBlank}>Add safeguard candidate</button></Panel>;
}

function TeamStep({ values, patch, context }: any) {
  const [search, setSearch] = useState('');
  const suggestionQuery = useLopaCreateTeamSuggestions({ hazopScenarioId: values.hazopScenarioId, siteId: values.siteId, ownerId: values.ownerId, facilitatorId: values.facilitatorId });
  const userSearch = useLopaCreateUserSearch(search, values.siteId, values.unitId, values.areaId);
  const selectedKeys = new Set((values.teamMembers ?? []).map((member: any) => member.userId ?? member.email).filter(Boolean));
  const missingRoles = missingRequiredRoles(values.teamMembers ?? []);
  function addMember(member: any) {
    const key = member.userId ?? member.email;
    if (key && selectedKeys.has(key)) return;
    patch({ teamMembers: [...values.teamMembers, normalizeWizardMember(member)] });
  }
  function addAllSuggestions() {
    const additions = (suggestionQuery.data?.rows ?? []).filter((row: any) => {
      const key = row.userId ?? row.email;
      return key && !selectedKeys.has(key);
    }).map(normalizeWizardMember);
    patch({ teamMembers: [...values.teamMembers, ...additions] });
  }
  function update(index: number, field: string, value: any) {
    patch({ teamMembers: values.teamMembers.map((item: any, i: number) => i === index ? { ...item, [field]: value } : item) });
  }
  function remove(index: number) {
    patch({ teamMembers: values.teamMembers.filter((_: any, i: number) => i !== index) });
  }
  return (
    <Panel title="Team & Sessions Setup">
      <div className="grid gap-3 md:grid-cols-2">
        <LopaOwnerSelector value={values.ownerId} onChange={(ownerId) => patch({ ownerId })} users={context?.users ?? []} siteId={values.siteId} unitId={values.unitId} areaId={values.areaId} hazopScenarioId={values.hazopScenarioId} facilitatorId={values.facilitatorId} compact />
        <Select label="Facilitator" value={values.facilitatorId ?? ''} onChange={(facilitatorId) => patch({ facilitatorId })} options={(context?.users ?? []).map((u: any) => [u.id, u.displayName || u.email])} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
            <div className="flex items-center justify-between gap-3">
              <div><div className="font-bold text-white">Auto-detected suggestions</div><p className="mt-1 text-sm text-slate-400">Real users suggested from owner/facilitator/source context and site-role signals.</p></div>
              <button className="lopa-button-secondary" onClick={addAllSuggestions} disabled={suggestionQuery.isLoading}>Add All</button>
            </div>
            {suggestionQuery.isLoading ? <div className="mt-3 text-sm text-slate-400">Loading team suggestions...</div> : null}
            <div className="mt-3 space-y-2">
              {(suggestionQuery.data?.rows ?? []).length ? suggestionQuery.data?.rows.map((row: any) => {
                const key = row.userId ?? row.email;
                const selected = key && selectedKeys.has(key);
                return <div key={`${row.role}-${key}`} className="rounded-lg border border-cyan-300/10 bg-[#06111f] p-3 text-sm"><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-white">{row.displayName ?? row.email ?? 'Suggested role'}</div><div className="text-slate-400">{row.role} - {row.discipline ?? 'No discipline'} - {row.email ?? 'No email'}</div><div className="mt-2 flex flex-wrap gap-1">{(row.suggestionReasons ?? []).map((reason: string) => <span key={reason} className="rounded border border-blue-400/20 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-100">{reason}</span>)}</div></div><button className="lopa-button-secondary" disabled={selected} onClick={() => addMember(row)}>{selected ? 'Selected' : 'Select'}</button></div></div>;
              }) : <div className="rounded-lg border border-cyan-300/10 p-3 text-sm text-slate-400">No team suggestions found. Use user search or add role placeholders.</div>}
            </div>
          </div>
          <div className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
            <div className="font-bold text-white">Search existing IAM/RBAC users</div>
            <input className="mt-3 w-full rounded-lg border border-cyan-300/10 bg-[#06111f] px-3 py-2 text-sm text-slate-100 outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, role, discipline, department..." />
            <div className="mt-3 space-y-2">
              {userSearch.isFetching ? <div className="text-sm text-slate-400">Searching users...</div> : null}
              {search.trim().length >= 2 && !(userSearch.data ?? []).length && !userSearch.isFetching ? <div className="text-sm text-slate-400">No users found.</div> : null}
              {(userSearch.data ?? []).map((user: any) => <div key={user.id} className="flex items-center justify-between rounded-lg border border-cyan-300/10 bg-[#06111f] p-3 text-sm"><div><div className="font-bold text-white">{user.displayName}</div><div className="text-slate-400">{user.email} - {user.jobTitle ?? 'No title'}</div>{user.accessWarning ? <div className="text-amber-200">{user.accessWarning}</div> : null}</div><button className="lopa-button-secondary" disabled={selectedKeys.has(user.userId)} onClick={() => addMember({ ...user, role: 'Reviewer', discipline: 'Process Safety', required: false, invitationMode: 'after_create' })}>{selectedKeys.has(user.userId) ? 'Added' : 'Add'}</button></div>)}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className={`rounded-xl border p-4 ${missingRoles.length ? 'border-amber-400/20 bg-amber-500/10' : 'border-emerald-400/20 bg-emerald-500/10'}`}>
            <div className="font-bold text-white">Team readiness preview: {missingRoles.length ? 'Warning' : 'Complete'}</div>
            <div className="mt-2 text-sm text-slate-300">{missingRoles.length ? `Missing required roles: ${missingRoles.join(', ')}` : 'Required LOPA roles are covered for creation.'}</div>
            {(suggestionQuery.data?.blockers ?? []).length ? <div className="mt-2 text-xs text-amber-100">{suggestionQuery.data?.blockers.map((item: any) => item.message).join(' ')}</div> : null}
          </div>
          <div className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
            <div className="mb-3 flex items-center justify-between"><div className="font-bold text-white">Selected team members</div><label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={!!values.sendInvitations} onChange={(event) => patch({ sendInvitations: event.target.checked })} />Send all invitations during create</label></div>
            <textarea className="mb-3 min-h-20 w-full rounded-lg border border-cyan-300/10 bg-[#06111f] p-3 text-sm text-slate-100 outline-none" value={values.invitationMessage ?? ''} onChange={(event) => patch({ invitationMessage: event.target.value })} placeholder="Invitation message included when invitations are sent" />
            <div className="space-y-3">
              {values.teamMembers.length ? values.teamMembers.map((member: any, index: number) => <div key={`${member.userId ?? member.email ?? index}`} className="rounded-xl border border-cyan-300/10 bg-[#06111f] p-3">
                <div className="grid gap-2 md:grid-cols-3"><Field label="Name" value={member.displayName ?? member.fullName ?? ''} onChange={(displayName) => update(index, 'displayName', displayName)} /><Field label="Email" value={member.email ?? ''} onChange={(email) => update(index, 'email', email)} /><Field label="Role" value={member.role} onChange={(role) => update(index, 'role', role)} /><Field label="Discipline" value={member.discipline ?? ''} onChange={(discipline) => update(index, 'discipline', discipline)} /><Select label="Access level" value={member.accessLevel ?? 'Comment'} onChange={(accessLevel) => update(index, 'accessLevel', accessLevel)} options={['View only', 'Comment', 'Edit study', 'Approve/sign-off']} /><Select label="Invitation" value={member.invitationMode ?? 'after_create'} onChange={(invitationMode) => update(index, 'invitationMode', invitationMode)} options={[['add_only', 'Add only'], ['now', 'Add and send now'], ['after_create', 'Send after creation']]} /></div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300"><label><input className="mr-2" type="checkbox" checked={!!member.required} onChange={(event) => update(index, 'required', event.target.checked)} />Required</label><label><input className="mr-2" type="checkbox" checked={!!member.reviewer} onChange={(event) => update(index, 'reviewer', event.target.checked)} />Reviewer</label><label><input className="mr-2" type="checkbox" checked={!!member.approver} onChange={(event) => update(index, 'approver', event.target.checked)} />Approver</label><label><input className="mr-2" type="checkbox" checked={!!member.facilitator} onChange={(event) => update(index, 'facilitator', event.target.checked)} />Facilitator</label><label><input className="mr-2" type="checkbox" checked={!!member.scribe} onChange={(event) => update(index, 'scribe', event.target.checked)} />Scribe</label><button className="ml-auto text-red-200" onClick={() => remove(index)}>Remove</button></div>
                {(member.suggestionReasons ?? []).length ? <div className="mt-2 text-xs text-blue-100">Reason: {member.suggestionReasons.join(', ')}</div> : null}
              </div>) : <div className="rounded-lg border border-cyan-300/10 p-3 text-sm text-slate-400">No team members selected yet.</div>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2"><button className="lopa-button-secondary" onClick={() => addMember({ role: 'Process Engineer', discipline: 'Process Engineering', required: true, invitationMode: 'after_create' })}>Add Process Engineer Placeholder</button><button className="lopa-button-secondary" onClick={() => addMember({ role: 'HSE / EHS Representative', discipline: 'HSE / Process Safety', required: true, invitationMode: 'after_create' })}>Add HSE Placeholder</button><button className="lopa-button-secondary" onClick={() => addMember({ role: 'SIS / Functional Safety Engineer', discipline: 'Instrument / Controls', required: false, invitationMode: 'after_create' })}>Add SIS Placeholder</button></div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function normalizeWizardMember(member: any) {
  return {
    userId: member.userId,
    contactId: member.contactId,
    displayName: member.displayName ?? member.fullName,
    fullName: member.fullName ?? member.displayName,
    email: member.email,
    role: member.role ?? 'Reviewer',
    discipline: member.discipline ?? 'Process Safety',
    required: !!member.required,
    organization: member.organization ?? 'Internal',
    internalExternal: member.internalExternal ?? 'Internal',
    jobTitle: member.jobTitle,
    department: member.department,
    reviewer: !!member.reviewer,
    approver: !!member.approver,
    facilitator: !!member.facilitator,
    scribe: !!member.scribe,
    accessLevel: member.accessLevel ?? 'Comment',
    invitationRequired: member.invitationMode !== 'add_only',
    invitationMode: member.invitationMode ?? 'after_create',
    suggestionReasons: member.suggestionReasons ?? [],
    suggestionSource: member.suggestionSource
  };
}

function missingRequiredRoles(members: any[]) {
  const roles = members.filter((member) => member.userId || member.email).map((member) => member.role);
  const required = ['LOPA Facilitator', 'Process Engineer', 'Operations Representative', 'HSE / EHS Representative'];
  return required.filter((role) => !roles.includes(role));
}

function ReviewStep({ values, validationOk, selectedScenario, context }: any) {
  const owner = (context?.users ?? []).find((user: any) => user.id === values.ownerId || user.userId === values.ownerId);
  const rows = [['Method', values.creationMethod], ['Title', values.title], ['Source', values.source], ['Site', values.siteId], ['Owner', owner ? `${owner.displayName} (${owner.email})` : values.ownerId], ['Consequence', values.consequence.description], ['Initiating Event', values.initiatingEvent.description], ['Safeguard candidates', values.importedSafeguards.length], ['Team members', values.teamMembers.length]];
  return <Panel title="Review & Create"><div className="grid gap-3 lg:grid-cols-[1fr_.55fr]"><div className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4"><div className="mb-3 font-bold text-white">Study Summary</div><div className="grid gap-2 md:grid-cols-2">{rows.map(([label, value]) => <Info key={label} label={label} value={String(value ?? '-')} />)}</div></div><div className={`rounded-xl border p-4 ${validationOk ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-amber-400/20 bg-amber-500/10'}`}><div className="font-bold text-white">{validationOk ? 'Ready to create' : 'Missing required fields'}</div><p className="mt-2 text-sm text-slate-300">{selectedScenario ? 'This will create bidirectional traceability to the source HAZOP scenario and store a source snapshot.' : 'This will create a manual LOPA record.'}</p></div></div></Panel>;
}

function Panel({ title, tone, children }: { title?: string; tone?: 'error'; children: ReactNode }) {
  return <section className={`rounded-xl border p-5 shadow-xl shadow-black/10 ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-300/10 bg-[#071525]'}`}>{title ? <h2 className="mb-4 text-lg font-bold text-white">{title}</h2> : null}{children}</section>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: any; type?: string; onChange: (value: string) => void }) {
  return <label className="space-y-1 text-xs text-slate-500"><span>{label}</span><input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-100 outline-none" /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<string | [string, string]>; onChange: (value: string) => void }) {
  return <label className="space-y-1 text-xs text-slate-500"><span>{label}</span><select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-100 outline-none"><option value="">Select...</option>{options.map((option) => { const id = Array.isArray(option) ? option[0] : option; const labelText = Array.isArray(option) ? option[1] : option; return <option key={id} value={id}>{labelText}</option>; })}</select></label>;
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return <div className="rounded-lg border border-cyan-300/10 bg-[#06111f] p-3"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-sm font-semibold text-slate-100">{value || '-'}</div></div>;
}
