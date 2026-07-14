'use client';

import { AlertTriangle, CheckCircle2, GitCompare, RefreshCw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLopaScenarioConsequence, useLopaScenarioConsequenceMutations } from '../../hooks/useLopaScenarioConsequence';
import { lopaImpactedReceptorSchema, lopaNoteSchema, lopaScenarioConsequenceSchema } from '../../schemas/lopa-scenario-consequence.schema';
import type { LopaScenarioConsequence } from '../../types/lopa-scenario-consequence.types';
import { inputClass, selectClass } from '../libraries/LibraryShared';
import { FieldGrid, LopaPanel, ProgressBar, TonePill } from '../overview/LopaOverviewShared';

export function LopaScenarioConsequenceTab({ id, onSelectTab }: { id: string; onSelectTab?: (tab: string) => void }) {
  const { data: query, context } = useLopaScenarioConsequence(id);
  const mutations = useLopaScenarioConsequenceMutations(id);
  const data = query.data;
  const [form, setForm] = useState<Record<string, any>>({});
  const [receptor, setReceptor] = useState<Record<string, any>>({});
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm(flattenScenario(data));
  }, [data]);

  const saving = mutations.update.isPending || mutations.syncHazop.isPending || mutations.markComplete.isPending;
  const readOnly = !!context.data?.readOnly;

  function setValue(key: string, value: any) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    setError(null);
    const parsed = lopaScenarioConsequenceSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Validation failed.');
      return;
    }
    mutations.update.mutate(parsed.data, {
      onSuccess: () => setMessage('Scenario & consequence saved.'),
      onError: (err: any) => setError(err?.response?.data?.message ?? err.message ?? 'Save failed.')
    });
  }

  function syncHazop() {
    setError(null);
    mutations.syncHazop.mutate(undefined, {
      onSuccess: () => setMessage('Linked HAZOP source synced.'),
      onError: (err: any) => setError(err?.response?.data?.message ?? err.message ?? 'Sync failed.')
    });
  }

  function markComplete() {
    setError(null);
    mutations.markComplete.mutate(undefined, {
      onSuccess: () => setMessage('Scenario & consequence marked complete.'),
      onError: (err: any) => setError(err?.response?.data?.message ?? err.message ?? 'Completion failed.')
    });
  }

  function addReceptor() {
    setError(null);
    const parsed = lopaImpactedReceptorSchema.safeParse(receptor);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Receptor validation failed.');
      return;
    }
    mutations.addReceptor.mutate(parsed.data, {
      onSuccess: () => {
        setReceptor({});
        setMessage('Impacted receptor added.');
      },
      onError: (err: any) => setError(err?.response?.data?.message ?? err.message ?? 'Could not add receptor.')
    });
  }

  function addNote() {
    const parsed = lopaNoteSchema.safeParse({ noteType: 'General', noteText: note, linkedSection: 'Scenario & Consequence', status: 'Open' });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Note validation failed.');
      return;
    }
    mutations.addNote.mutate(parsed.data, {
      onSuccess: () => {
        setNote('');
        setMessage('Note saved.');
      },
      onError: (err: any) => setError(err?.response?.data?.message ?? err.message ?? 'Could not save note.')
    });
  }

  if (query.isLoading) return <State text="Loading Scenario & Consequence from API..." />;
  if (query.isError || !data) return <State text="Unable to load Scenario & Consequence. Check permissions or API status." tone="error" />;

  return (
    <div className="space-y-4">
      {message ? <Toast tone="success" text={message} onClose={() => setMessage(null)} /> : null}
      {error ? <Toast tone="danger" text={error} onClose={() => setError(null)} /> : null}
      {readOnly ? <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">This LOPA study is read-only. Reopen it before editing Scenario & Consequence.</div> : null}
      <SummaryCards data={data} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <LinkedHazopPanel data={data} onSync={syncHazop} syncing={mutations.syncHazop.isPending} readOnly={readOnly} />
        <ReadinessPanel readiness={data.readiness} onComplete={markComplete} busy={mutations.markComplete.isPending} readOnly={readOnly} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ScenarioDefinitionPanel form={form} context={context.data} setValue={setValue} readOnly={readOnly} />
        <CauseConsequencePanel form={form} context={context.data} setValue={setValue} readOnly={readOnly} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ConsequenceClassificationPanel form={form} context={context.data} setValue={setValue} readOnly={readOnly} />
        <RiskCriteriaPanel form={form} context={context.data} setValue={setValue} readOnly={readOnly} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="lopa-button-primary disabled:opacity-50" disabled={saving || readOnly} onClick={save}><Save size={15} />{saving ? 'Saving...' : 'Save Scenario & Consequence'}</button>
        <button className="lopa-button-secondary" onClick={() => onSelectTab?.('initiating-event')}>Continue to Initiating Event</button>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <ReceptorsPanel data={data} context={context.data} receptor={receptor} setReceptor={setReceptor} addReceptor={addReceptor} deleteReceptor={(rid: string) => mutations.deleteReceptor.mutate(rid)} readOnly={readOnly} />
        <SourceComparisonPanel data={data} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <NotesPanel data={data} note={note} setNote={setNote} addNote={addNote} deleteNote={(nid: string) => mutations.deleteNote.mutate(nid)} readOnly={readOnly} />
        <ScenarioActionsPanel data={data} onSelectTab={onSelectTab} />
      </div>
    </div>
  );
}

function SummaryCards({ data }: { data: LopaScenarioConsequence }) {
  const cards = [
    ['Scenario readiness', data.summary.scenarioCompleteness, toneFor(data.summary.scenarioCompleteness)],
    ['Linked HAZOP', data.summary.linkedHazopStatus, data.linkedHazop ? 'info' : 'warning'],
    ['Consequence severity', data.summary.consequenceSeverity, toneForRisk(data.summary.consequenceSeverity)],
    ['Impacted receptors', data.summary.impactedReceptors, data.summary.impactedReceptors ? 'success' : 'warning'],
    ['Tolerable frequency', formatNumber(data.summary.tolerableFrequency), data.summary.tolerableFrequency ? 'success' : 'warning'],
    ['Source changes', data.summary.sourceChanged, data.summary.sourceChanged ? 'warning' : 'success']
  ] as const;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
      {cards.map(([label, value, tone]) => <div key={label} className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4"><div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div><div className="mt-2 text-lg font-black text-white">{value ?? '-'}</div><TonePill tone={tone}>{String(tone).toUpperCase()}</TonePill></div>)}
    </div>
  );
}

function LinkedHazopPanel({ data, onSync, syncing, readOnly }: { data: LopaScenarioConsequence; onSync: () => void; syncing: boolean; readOnly: boolean }) {
  const source = data.linkedHazop;
  return (
    <LopaPanel title="Linked HAZOP Scenario Snapshot" action={<button className="lopa-button-secondary disabled:opacity-50" disabled={!source || syncing || readOnly} onClick={onSync}><RefreshCw size={14} />{syncing ? 'Syncing...' : 'Sync from HAZOP'}</button>}>
      {!source ? <Empty text="This LOPA study is manual or the linked HAZOP source is restricted." /> : (
        <div className="space-y-4">
          {source.sourceChanged ? <div className="flex gap-2 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100"><AlertTriangle size={18} />The HAZOP source changed after the LOPA snapshot. Review comparison before relying on imported values.</div> : null}
          <FieldGrid items={[
            ['HAZOP', `${source.hazopNumber ?? '-'} - ${source.hazopTitle ?? '-'}`],
            ['Node / deviation', `${source.node ?? '-'} / ${source.deviation ?? '-'}`],
            ['Cause', source.cause],
            ['Consequence', source.consequence],
            ['Initial / residual risk', `${source.initialRisk ?? '-'} / ${source.residualRisk ?? '-'}`],
            ['LOPA reason', source.lopaRequiredReason],
            ['Equipment', source.equipmentTag],
            ['Traceability', source.traceabilityStatus ?? 'Linked']
          ]} />
        </div>
      )}
    </LopaPanel>
  );
}

function ScenarioDefinitionPanel({ form, context, setValue, readOnly }: any) {
  return (
    <LopaPanel title="Scenario Definition">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input label="Scenario Title" value={form.scenarioTitle} onChange={(v) => setValue('scenarioTitle', v)} readOnly={readOnly} />
        <Select label="Operating Mode" value={form.operatingMode} options={context?.operatingModes ?? []} onChange={(v) => setValue('operatingMode', v)} readOnly={readOnly} />
        <Select label="Source" value={form.scenarioSource} options={context?.scenarioSources ?? []} onChange={(v) => setValue('scenarioSource', v)} readOnly={readOnly} />
        <Input label="Equipment / System" value={form.equipmentSystem} onChange={(v) => setValue('equipmentSystem', v)} readOnly={readOnly} />
        <TextArea label="Description" value={form.scenarioDescription} onChange={(v) => setValue('scenarioDescription', v)} readOnly={readOnly} />
        <TextArea label="Boundary / LOPA Boundary" value={form.scenarioBoundary} onChange={(v) => setValue('scenarioBoundary', v)} readOnly={readOnly} />
        <TextArea label="Assumptions" value={form.assumptions} onChange={(v) => setValue('assumptions', v)} readOnly={readOnly} />
        <TextArea label="Exclusions" value={form.exclusions} onChange={(v) => setValue('exclusions', v)} readOnly={readOnly} />
      </div>
    </LopaPanel>
  );
}

function CauseConsequencePanel({ form, context, setValue, readOnly }: any) {
  return (
    <LopaPanel title="Cause / Deviation / Consequence">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input label="Guideword" value={form.guideword} onChange={(v) => setValue('guideword', v)} readOnly={readOnly} />
        <Input label="Parameter" value={form.parameter} onChange={(v) => setValue('parameter', v)} readOnly={readOnly} />
        <Input label="Deviation" value={form.deviation} onChange={(v) => setValue('deviation', v)} readOnly={readOnly} />
        <Select label="Cause Category" value={form.causeCategory} options={context?.causeCategories ?? []} onChange={(v) => setValue('causeCategory', v)} readOnly={readOnly} />
        <TextArea label="Cause" value={form.causeDescription} onChange={(v) => setValue('causeDescription', v)} readOnly={readOnly} />
        <TextArea label="Consequence" value={form.consequenceDescription} onChange={(v) => setValue('consequenceDescription', v)} readOnly={readOnly} />
        <Input label="Top Event" value={form.topEvent} onChange={(v) => setValue('topEvent', v)} readOnly={readOnly} />
        <Input label="Hazardous Event" value={form.hazardousEvent} onChange={(v) => setValue('hazardousEvent', v)} readOnly={readOnly} />
        <TextArea label="Safeguards Summary" value={form.safeguardsSummary} onChange={(v) => setValue('safeguardsSummary', v)} readOnly={readOnly} />
        <TextArea label="Escalation Path" value={form.escalationPath} onChange={(v) => setValue('escalationPath', v)} readOnly={readOnly} />
      </div>
    </LopaPanel>
  );
}

function ConsequenceClassificationPanel({ form, context, setValue, readOnly }: any) {
  return (
    <LopaPanel title="Consequence Classification">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Select label="Category" value={form.consequenceCategory} options={context?.consequenceCategories ?? []} onChange={(v) => setValue('consequenceCategory', v)} readOnly={readOnly} />
        <Select label="Impact Type" value={form.impactType} options={context?.impactTypes ?? []} onChange={(v) => setValue('impactType', v)} readOnly={readOnly} />
        <Input label="Severity" value={form.consequenceSeverity} onChange={(v) => setValue('consequenceSeverity', v)} readOnly={readOnly} />
        <Input label="Endpoint" value={form.consequenceEndpoint} onChange={(v) => setValue('consequenceEndpoint', v)} readOnly={readOnly} />
        <TextArea label="Credible Worst-Case Consequence" value={form.credibleWorstCase} onChange={(v) => setValue('credibleWorstCase', v)} readOnly={readOnly} />
        <TextArea label="Most Likely Consequence" value={form.mostLikelyConsequence} onChange={(v) => setValue('mostLikelyConsequence', v)} readOnly={readOnly} />
        <TextArea label="Basis" value={form.consequenceBasis} onChange={(v) => setValue('consequenceBasis', v)} readOnly={readOnly} />
        <TextArea label="Source / Reference" value={form.consequenceSourceReference} onChange={(v) => setValue('consequenceSourceReference', v)} readOnly={readOnly} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        {['personnelImpact', 'environmentalImpact', 'assetImpact', 'communityImpact', 'regulatoryImpact'].map((key) => <Toggle key={key} label={labelize(key)} checked={!!form[key]} onChange={(v) => setValue(key, v)} disabled={readOnly} />)}
      </div>
    </LopaPanel>
  );
}

function RiskCriteriaPanel({ form, context, setValue, readOnly }: any) {
  return (
    <LopaPanel title="Tolerable Risk Criteria">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input label="Tolerable Event Frequency" type="number" value={form.tolerableEventFrequency} onChange={(v) => setValue('tolerableEventFrequency', v)} readOnly={readOnly} />
        <Select label="Criteria Source" value={form.riskCriteriaSource} options={context?.riskCriteriaSources ?? []} onChange={(v) => setValue('riskCriteriaSource', v)} readOnly={readOnly} />
        <Select label="Criteria Type" value={form.criteriaType} options={context?.riskCriteriaTypes ?? []} onChange={(v) => setValue('criteriaType', v)} readOnly={readOnly} />
        <Input label="Criteria Version" value={form.criteriaVersion} onChange={(v) => setValue('criteriaVersion', v)} readOnly={readOnly} />
        <TextArea label="Criteria Notes" value={form.criteriaNotes} onChange={(v) => setValue('criteriaNotes', v)} readOnly={readOnly} />
        <Input label="Approval Status" value={form.criteriaApprovalStatus} onChange={(v) => setValue('criteriaApprovalStatus', v)} readOnly={readOnly} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        <Toggle label="ALARP applicable" checked={!!form.alarpApplicable} onChange={(v) => setValue('alarpApplicable', v)} disabled={readOnly} />
        <Toggle label="Risk acceptance required" checked={!!form.riskAcceptanceRequired} onChange={(v) => setValue('riskAcceptanceRequired', v)} disabled={readOnly} />
      </div>
    </LopaPanel>
  );
}

function ReceptorsPanel({ data, context, receptor, setReceptor, addReceptor, deleteReceptor, readOnly }: any) {
  return (
    <LopaPanel title="Impacted Receptors">
      <div className="space-y-3">
        {!readOnly ? <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <Select label="Receptor Type" value={receptor.receptorType} options={context?.receptorTypes ?? []} onChange={(v) => setReceptor((r: any) => ({ ...r, receptorType: v }))} />
          <Select label="Exposure Route" value={receptor.exposureRoute} options={context?.exposureRoutes ?? []} onChange={(v) => setReceptor((r: any) => ({ ...r, exposureRoute: v }))} />
          <Input label="Severity" value={receptor.severity} onChange={(v) => setReceptor((r: any) => ({ ...r, severity: v }))} />
          <Input label="Exposure Location" value={receptor.exposureLocation} onChange={(v) => setReceptor((r: any) => ({ ...r, exposureLocation: v }))} />
          <Input label="Occupancy / Presence" value={receptor.estimatedOccupancyPresence} onChange={(v) => setReceptor((r: any) => ({ ...r, estimatedOccupancyPresence: v }))} />
          <button className="lopa-button-primary self-end" onClick={addReceptor}>Add Receptor</button>
        </div> : null}
        {data.receptors.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Type</th><th>Route</th><th>Location</th><th>Severity</th><th /></tr></thead><tbody>{data.receptors.map((r: any) => <tr key={r.id} className="border-t border-cyan-300/10"><td className="py-2 font-semibold text-white">{r.receptor_type}</td><td>{r.exposure_route ?? '-'}</td><td>{r.exposure_location ?? '-'}</td><td><TonePill tone={toneForRisk(r.severity)}>{r.severity ?? '-'}</TonePill></td><td className="text-right">{!readOnly ? <button className="text-xs text-red-200" onClick={() => deleteReceptor(r.id)}>Archive</button> : null}</td></tr>)}</tbody></table></div> : <Empty text="No impacted receptors recorded yet." />}
      </div>
    </LopaPanel>
  );
}

function SourceComparisonPanel({ data }: { data: LopaScenarioConsequence }) {
  return (
    <LopaPanel title="Source Snapshot / Change Comparison" action={<GitCompare size={16} className="text-cyan-200" />}>
      {data.comparison.rows?.length ? <div className="space-y-2">{data.comparison.rows.map((row: any) => <div key={row.key} className={`rounded-lg border p-3 ${row.changed ? 'border-amber-400/20 bg-amber-500/10' : 'border-cyan-300/10 bg-[#03101d]'}`}><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase text-slate-400">{labelize(row.key)}</span><TonePill tone={row.changed ? 'warning' : 'success'}>{row.changed ? 'Changed' : 'Aligned'}</TonePill></div><div className="mt-2 grid grid-cols-1 gap-2 text-xs md:grid-cols-2"><div><span className="text-slate-500">Snapshot: </span>{row.sourceValue ?? '-'}</div><div><span className="text-slate-500">Current: </span>{row.currentValue ?? '-'}</div></div></div>)}</div> : <Empty text="No source comparison available." />}
    </LopaPanel>
  );
}

function ReadinessPanel({ readiness, onComplete, busy, readOnly }: any) {
  return (
    <LopaPanel title="Consequence Completeness / Readiness" action={<button className="lopa-button-secondary disabled:opacity-50" disabled={busy || readOnly || readiness.status === 'Blocked'} onClick={onComplete}><CheckCircle2 size={14} />Mark Complete</button>}>
      <div className="mb-4 flex items-center gap-3"><div className="text-3xl font-black text-white">{readiness.completionPercent ?? 0}%</div><div className="flex-1"><ProgressBar value={readiness.completionPercent ?? 0} tone={readiness.status === 'Blocked' ? 'danger' : readiness.status === 'Warning' ? 'warning' : 'success'} /></div><TonePill tone={toneFor(readiness.status)}>{readiness.status}</TonePill></div>
      <div className="space-y-2">{readiness.checklist.map((check: any) => <div key={check.key} className="flex items-center justify-between gap-3 rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm"><span>{check.label}</span><TonePill tone={check.complete ? 'success' : check.status === 'Warning' ? 'warning' : 'danger'}>{check.status}</TonePill></div>)}</div>
    </LopaPanel>
  );
}

function NotesPanel({ data, note, setNote, addNote, deleteNote, readOnly }: any) {
  return (
    <LopaPanel title="Scenario Notes & Assumptions">
      {!readOnly ? <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]"><input className={inputClass} placeholder="Add note, assumption, exclusion, reviewer comment, or open question..." value={note} onChange={(event) => setNote(event.target.value)} /><button className="lopa-button-primary" onClick={addNote}>Add Note</button></div> : null}
      {data.notes.length ? <div className="space-y-2">{data.notes.map((item: any) => <div key={item.id} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3"><div className="flex items-center justify-between gap-2"><TonePill>{item.note_type ?? 'General'}</TonePill>{!readOnly ? <button className="text-xs text-red-200" onClick={() => deleteNote(item.id)}>Archive</button> : null}</div><p className="mt-2 text-sm text-slate-200">{item.note_text}</p></div>)}</div> : <Empty text="No notes yet." />}
    </LopaPanel>
  );
}

function ScenarioActionsPanel({ data, onSelectTab }: { data: LopaScenarioConsequence; onSelectTab: ((tab: string) => void) | undefined }) {
  return (
    <LopaPanel title="Scenario Actions">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <ActionButton label="Complete initiating event" onClick={() => onSelectTab?.('initiating-event')} />
        <ActionButton label="Review safeguards" onClick={() => onSelectTab?.('ipls')} />
        <ActionButton label="Create action / recommendation" onClick={() => onSelectTab?.('actions')} />
        <ActionButton label="Run calculation" onClick={() => onSelectTab?.('risk-calculation')} />
      </div>
      <div className="mt-4 space-y-2">{data.actions.length ? data.actions.map((action: any) => <div key={action.id} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm"><div className="font-semibold text-white">{action.title}</div><div className="mt-1 text-xs text-slate-400">{action.status} · {action.priority ?? 'No priority'}</div></div>) : <Empty text="No linked Universal Actions yet." />}</div>
    </LopaPanel>
  );
}

function Input({ label, value, onChange, type = 'text', readOnly = false }: { label: string; value?: any; onChange: (value: string) => void; type?: string; readOnly?: boolean }) {
  return <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span><input type={type} disabled={readOnly} className={`${inputClass} disabled:opacity-60`} value={value ?? ''} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextArea({ label, value, onChange, readOnly = false }: { label: string; value?: any; onChange: (value: string) => void; readOnly?: boolean }) {
  return <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span><textarea disabled={readOnly} className={`${inputClass} min-h-24 disabled:opacity-60`} value={value ?? ''} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, options, onChange, readOnly = false }: { label: string; value?: any; options: string[]; onChange: (value: string) => void; readOnly?: boolean }) {
  return <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span><select disabled={readOnly} className={`${selectClass} disabled:opacity-60`} value={value ?? ''} onChange={(event) => onChange(event.target.value)}><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function Toggle({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return <button disabled={disabled} type="button" onClick={() => onChange(!checked)} className={`rounded-lg border px-3 py-2 text-left text-xs font-bold ${checked ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100' : 'border-cyan-300/10 bg-[#03101d] text-slate-300'} disabled:opacity-60`}>{label}</button>;
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-left text-sm font-semibold text-slate-200 hover:border-blue-400/40 hover:bg-blue-500/10">{label}</button>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-cyan-300/10 bg-[#03101d] p-4 text-sm text-slate-400">{text}</div>;
}

function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) {
  return <div className={`rounded-xl border p-5 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-300/10 bg-[#071525] text-slate-400'}`}>{text}</div>;
}

function Toast({ text, tone, onClose }: { text: string; tone: 'success' | 'danger'; onClose: () => void }) {
  return <div className={`flex items-center justify-between rounded-xl border p-3 text-sm ${tone === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100' : 'border-red-400/20 bg-red-500/10 text-red-100'}`}><span>{text}</span><button onClick={onClose}>Dismiss</button></div>;
}

function flattenScenario(data: LopaScenarioConsequence) {
  return {
    scenarioTitle: data.scenario.title ?? '',
    scenarioDescription: data.scenario.description ?? '',
    scenarioSource: data.scenario.source ?? '',
    operatingMode: data.scenario.operatingMode ?? '',
    equipmentSystem: data.scenario.equipmentSystem ?? '',
    equipmentTag: data.scenario.equipmentTag ?? '',
    scenarioBoundary: data.scenario.boundary ?? '',
    includedEquipment: data.scenario.includedEquipment ?? '',
    excludedEquipment: data.scenario.excludedEquipment ?? '',
    assumptions: data.scenario.assumptions ?? '',
    exclusions: data.scenario.exclusions ?? '',
    ownerId: data.scenario.ownerId ?? '',
    reviewStatus: data.scenario.reviewStatus ?? '',
    deviation: data.causeConsequence.deviation ?? '',
    guideword: data.causeConsequence.guideword ?? '',
    parameter: data.causeConsequence.parameter ?? '',
    causeDescription: data.causeConsequence.cause ?? '',
    causeCategory: data.causeConsequence.causeCategory ?? '',
    causeType: data.causeConsequence.causeType ?? '',
    consequenceDescription: data.causeConsequence.consequence ?? data.consequence.description ?? '',
    escalationPath: data.causeConsequence.escalationPath ?? '',
    hazardousEvent: data.causeConsequence.hazardousEvent ?? '',
    lossEvent: data.causeConsequence.lossEvent ?? '',
    topEvent: data.causeConsequence.topEvent ?? '',
    safeguardsSummary: data.causeConsequence.safeguardsSummary ?? '',
    lopaBoundaryStatement: data.causeConsequence.lopaBoundaryStatement ?? '',
    consequenceCategory: data.consequence.category ?? '',
    consequenceSeverity: data.consequence.severity ?? '',
    consequenceEndpoint: data.consequence.endpoint ?? '',
    impactType: data.consequence.impactType ?? '',
    credibleWorstCase: data.consequence.credibleWorstCase ?? '',
    mostLikelyConsequence: data.consequence.mostLikelyConsequence ?? '',
    consequenceBasis: data.consequence.basis ?? '',
    consequenceSourceReference: data.consequence.sourceReference ?? '',
    tolerableEventFrequency: data.consequence.tolerableEventFrequency ?? '',
    riskCriteriaSource: data.consequence.riskCriteriaSource ?? '',
    criteriaType: data.riskCriteria?.criteria_type ?? '',
    criteriaVersion: data.riskCriteria?.criteria_version ?? '',
    personnelImpact: !!data.consequence.personnelImpact,
    environmentalImpact: !!data.consequence.environmentalImpact,
    assetImpact: !!data.consequence.assetImpact,
    communityImpact: !!data.consequence.communityImpact,
    regulatoryImpact: !!data.consequence.regulatoryImpact,
    alarpApplicable: !!data.riskCriteria?.alarp_applicable,
    riskAcceptanceRequired: !!data.riskCriteria?.risk_acceptance_required,
    criteriaNotes: data.riskCriteria?.criteria_notes ?? '',
    criteriaApprovalStatus: data.riskCriteria?.approval_status ?? '',
    notes: data.consequence.notes ?? '',
    editReason: ''
  };
}

function toneFor(value?: any) {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('ready') || text.includes('complete') || text.includes('linked')) return 'success';
  if (text.includes('block') || text.includes('missing')) return 'danger';
  if (text.includes('warning') || text.includes('change')) return 'warning';
  return 'info';
}

function toneForRisk(value?: any) {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('critical') || text.includes('high') || text.includes('catastrophic')) return 'danger';
  if (text.includes('medium') || text.includes('major')) return 'warning';
  if (!value || text.includes('missing')) return 'warning';
  return 'success';
}

function formatNumber(value: any) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number.toExponential(2) : value ?? '-';
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}
