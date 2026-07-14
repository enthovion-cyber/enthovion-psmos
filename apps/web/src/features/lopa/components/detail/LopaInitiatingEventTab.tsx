'use client';

import { Calculator, CheckCircle2, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLopaInitiatingEvent, useLopaInitiatingEventMutations } from '../../hooks/useLopaInitiatingEvent';
import { lopaInitiatingEventSchema, lopaManualFrequencySchema, lopaSiteModifierSchema } from '../../schemas/lopa-initiating-event.schema';
import type { LopaInitiatingEventTabData } from '../../types/lopa-initiating-event.types';
import { ConditionalModifierLibrarySelector } from '../selectors/ConditionalModifierLibrarySelector';
import { InitiatingEventLibrarySelector } from '../selectors/InitiatingEventLibrarySelector';
import { inputClass, selectClass } from '../libraries/LibraryShared';
import { FieldGrid, LopaPanel, ProgressBar, TonePill } from '../overview/LopaOverviewShared';

export function LopaInitiatingEventTab({ id, onSelectTab }: { id: string; onSelectTab?: (tab: string) => void }) {
  const { data: query, context } = useLopaInitiatingEvent(id);
  const mutations = useLopaInitiatingEventMutations(id);
  const data = query.data;
  const [definition, setDefinition] = useState<Record<string, any>>({});
  const [manual, setManual] = useState<Record<string, any>>({ frequencyUnit: 'per year', approvalStatus: 'Pending Review' });
  const [siteModifier, setSiteModifier] = useState<Record<string, any>>({ enabled: false, modifierValue: 1, modifierType: 'Site-specific factor', approvalStatus: 'Pending Review' });
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setDefinition({
      description: data.definition.description ?? '',
      eventCategory: data.definition.category ?? '',
      failureMode: data.definition.failureMode ?? '',
      equipmentSystem: data.definition.equipmentSystem ?? '',
      equipmentTag: data.definition.equipmentTag ?? '',
      eventBoundary: data.definition.boundary ?? '',
      eventTrigger: data.definition.trigger ?? '',
      linkedConsequenceId: data.definition.linkedConsequenceId ?? '',
      eventSource: data.definition.source ?? '',
      notes: data.definition.notes ?? ''
    });
    setManual({
      frequencyPerYear: data.manualFrequency.frequency ?? '',
      frequencyUnit: data.manualFrequency.unit ?? 'per year',
      lowEstimate: data.manualFrequency.low ?? '',
      highEstimate: data.manualFrequency.high ?? '',
      confidenceLevel: data.manualFrequency.confidence ?? '',
      basis: data.manualFrequency.basis ?? '',
      sourceReference: data.manualFrequency.sourceReference ?? '',
      engineeringJustification: data.manualFrequency.justification ?? '',
      reviewerRequired: !!data.manualFrequency.reviewerRequired,
      approvalStatus: data.manualFrequency.approvalStatus ?? 'Pending Review'
    });
    setSiteModifier({
      enabled: !!data.siteModifier.enabled,
      modifierValue: data.siteModifier.value ?? 1,
      modifierType: data.siteModifier.type ?? 'Site-specific factor',
      basis: data.siteModifier.basis ?? '',
      sourceReference: data.siteModifier.sourceReference ?? '',
      engineeringJustification: data.siteModifier.justification ?? '',
      approvalStatus: data.siteModifier.approvalStatus ?? 'Pending Review'
    });
  }, [data]);

  const readOnly = !!context.data?.readOnly;

  function saveDefinition() {
    setError(null);
    const parsed = lopaInitiatingEventSchema.safeParse(definition);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Validation failed.');
      return;
    }
    mutations.update.mutate(parsed.data, {
      onSuccess: () => setMessage('Initiating event definition saved.'),
      onError: (err: any) => setError(err?.response?.data?.message ?? err.message ?? 'Save failed.')
    });
  }

  function saveManual() {
    setError(null);
    const parsed = lopaManualFrequencySchema.safeParse(manual);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Manual frequency validation failed.');
      return;
    }
    mutations.saveManualFrequency.mutate(parsed.data, {
      onSuccess: () => setMessage('Manual frequency snapshot saved.'),
      onError: (err: any) => setError(err?.response?.data?.message ?? err.message ?? 'Manual frequency save failed.')
    });
  }

  function saveSiteModifier() {
    setError(null);
    const parsed = lopaSiteModifierSchema.safeParse(siteModifier);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Site modifier validation failed.');
      return;
    }
    mutations.saveSiteModifier.mutate(parsed.data, {
      onSuccess: () => setMessage('Site modifier saved.'),
      onError: (err: any) => setError(err?.response?.data?.message ?? err.message ?? 'Site modifier save failed.')
    });
  }

  function markComplete() {
    mutations.markComplete.mutate(undefined, {
      onSuccess: () => setMessage('Initiating Event marked complete.'),
      onError: (err: any) => setError(err?.response?.data?.message ?? err.message ?? 'Completion failed.')
    });
  }

  function addNote() {
    if (!note.trim()) return;
    mutations.addNote.mutate({ noteType: 'General', noteText: note, linkedSection: 'Initiating Event', status: 'Open' }, {
      onSuccess: () => {
        setNote('');
        setMessage('Initiating event note saved.');
      },
      onError: (err: any) => setError(err?.response?.data?.message ?? err.message ?? 'Could not save note.')
    });
  }

  if (query.isLoading) return <State text="Loading Initiating Event from API..." />;
  if (query.isError || !data) return <State text="Unable to load Initiating Event. Check permissions or API status." tone="error" />;

  return (
    <div className="space-y-4">
      {message ? <Toast tone="success" text={message} onClose={() => setMessage(null)} /> : null}
      {error ? <Toast tone="danger" text={error} onClose={() => setError(null)} /> : null}
      {readOnly ? <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">This LOPA study is read-only. Reopen it before editing Initiating Event.</div> : null}
      <SummaryCards data={data} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <DefinitionPanel form={definition} setForm={setDefinition} categories={context.data?.initiatingEventCategories ?? []} readOnly={readOnly} onSave={saveDefinition} saving={mutations.update.isPending} />
        <ReadinessPanel readiness={data.readiness} onComplete={markComplete} busy={mutations.markComplete.isPending} readOnly={readOnly} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LibrarySelectionPanel id={id} data={data} readOnly={readOnly} onSelected={() => { setMessage('Approved initiating event library snapshot selected.'); void query.refetch(); }} />
        <ManualFrequencyPanel form={manual} setForm={setManual} readOnly={readOnly} onSave={saveManual} saving={mutations.saveManualFrequency.isPending} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SiteModifierPanel form={siteModifier} setForm={setSiteModifier} readOnly={readOnly} onSave={saveSiteModifier} saving={mutations.saveSiteModifier.isPending} />
        <FrequencySnapshotPanel data={data} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <ConditionalModifierSelectionPanel id={id} readOnly={readOnly} onSelected={() => { setMessage('Conditional modifier snapshot selected.'); void query.refetch(); }} />
        <SelectedModifiersPanel data={data} readOnly={readOnly} update={(snapshotId, values) => mutations.updateModifier.mutate({ snapshotId, values })} archive={(snapshotId) => mutations.archiveModifier.mutate(snapshotId)} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <NotesPanel data={data} note={note} setNote={setNote} addNote={addNote} deleteNote={(nid: string) => mutations.deleteNote.mutate(nid)} readOnly={readOnly} />
        <ActionsPanel data={data} onSelectTab={onSelectTab} />
      </div>
    </div>
  );
}

function SummaryCards({ data }: { data: LopaInitiatingEventTabData }) {
  const cards = [
    ['IE status', data.summary.status, toneFor(data.summary.status)],
    ['Input method', data.summary.inputMethod, data.summary.inputMethod === 'Manual' ? 'warning' : 'info'],
    ['Event category', data.summary.eventCategory, data.summary.eventCategory === 'Missing' ? 'warning' : 'success'],
    ['Base frequency', formatNumber(data.summary.baseFrequency), data.summary.baseFrequency ? 'success' : 'warning'],
    ['Modifier factor', formatNumber(data.summary.combinedModifierFactor), data.summary.conditionalModifiersApplied ? 'info' : 'warning'],
    ['Ready for calculation', data.summary.readyForCalculation ? 'Yes' : 'No', data.summary.readyForCalculation ? 'success' : 'warning']
  ] as const;
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">{cards.map(([label, value, tone]) => <div key={label} className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4"><div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div><div className="mt-2 text-lg font-black text-white">{value ?? '-'}</div><TonePill tone={tone}>{String(tone).toUpperCase()}</TonePill></div>)}</div>;
}

function DefinitionPanel({ form, setForm, categories, readOnly, onSave, saving }: any) {
  const set = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));
  return (
    <LopaPanel title="Initiating Event Definition" action={<button className="lopa-button-primary disabled:opacity-50" disabled={readOnly || saving} onClick={onSave}><Save size={14} />{saving ? 'Saving...' : 'Save Definition'}</button>}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextArea label="Initiating Event Description" value={form.description} onChange={(v) => set('description', v)} readOnly={readOnly} />
        <Select label="Category" value={form.eventCategory} options={categories} onChange={(v) => set('eventCategory', v)} readOnly={readOnly} />
        <Input label="Failure Mode" value={form.failureMode} onChange={(v) => set('failureMode', v)} readOnly={readOnly} />
        <Input label="Equipment / System" value={form.equipmentSystem} onChange={(v) => set('equipmentSystem', v)} readOnly={readOnly} />
        <Input label="Equipment Tag" value={form.equipmentTag} onChange={(v) => set('equipmentTag', v)} readOnly={readOnly} />
        <Input label="Trigger" value={form.eventTrigger} onChange={(v) => set('eventTrigger', v)} readOnly={readOnly} />
        <TextArea label="Boundary" value={form.eventBoundary} onChange={(v) => set('eventBoundary', v)} readOnly={readOnly} />
        <TextArea label="Notes" value={form.notes} onChange={(v) => set('notes', v)} readOnly={readOnly} />
      </div>
    </LopaPanel>
  );
}

function LibrarySelectionPanel({ id, data, readOnly, onSelected }: { id: string; data: LopaInitiatingEventTabData; readOnly: boolean; onSelected: () => void }) {
  return (
    <LopaPanel title="Initiating Event Library Selection">
      {data.librarySnapshot ? <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100"><ShieldCheck className="mb-2" size={18} />Using approved library snapshot revision {data.librarySnapshot.library_revision ?? '-'}: {data.librarySnapshot.event_code} - {data.librarySnapshot.event_name}</div> : <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">No approved initiating event library value has been snapshotted yet. Manual frequency entry requires justification and approval.</div>}
      {readOnly ? null : <InitiatingEventLibrarySelector studyId={id} onSelected={onSelected} />}
    </LopaPanel>
  );
}

function ManualFrequencyPanel({ form, setForm, readOnly, onSave, saving }: any) {
  const set = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));
  return (
    <LopaPanel title="Manual Frequency Entry">
      <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100">Manual frequency requires source/reference and engineering justification. Changes after calculation will mark calculation as Needs Recalculation.</div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input label="Frequency per year" type="number" value={form.frequencyPerYear} onChange={(v) => set('frequencyPerYear', v)} readOnly={readOnly} />
        <Input label="Frequency Unit" value={form.frequencyUnit} onChange={(v) => set('frequencyUnit', v)} readOnly={readOnly} />
        <Input label="Low Estimate" type="number" value={form.lowEstimate} onChange={(v) => set('lowEstimate', v)} readOnly={readOnly} />
        <Input label="High Estimate" type="number" value={form.highEstimate} onChange={(v) => set('highEstimate', v)} readOnly={readOnly} />
        <Input label="Confidence Level" value={form.confidenceLevel} onChange={(v) => set('confidenceLevel', v)} readOnly={readOnly} />
        <Input label="Approval Status" value={form.approvalStatus} onChange={(v) => set('approvalStatus', v)} readOnly={readOnly} />
        <TextArea label="Basis" value={form.basis} onChange={(v) => set('basis', v)} readOnly={readOnly} />
        <TextArea label="Source / Reference" value={form.sourceReference} onChange={(v) => set('sourceReference', v)} readOnly={readOnly} />
        <TextArea label="Engineering Justification" value={form.engineeringJustification} onChange={(v) => set('engineeringJustification', v)} readOnly={readOnly} />
        <Toggle label="Reviewer required" checked={!!form.reviewerRequired} onChange={(v) => set('reviewerRequired', v)} disabled={readOnly} />
      </div>
      {!readOnly ? <button className="lopa-button-primary mt-3 disabled:opacity-50" disabled={saving} onClick={onSave}>{saving ? 'Saving...' : 'Save Manual Frequency'}</button> : null}
    </LopaPanel>
  );
}

function SiteModifierPanel({ form, setForm, readOnly, onSave, saving }: any) {
  const set = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));
  return (
    <LopaPanel title="Site Modifier">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Toggle label="Apply site modifier" checked={!!form.enabled} onChange={(v) => set('enabled', v)} disabled={readOnly} />
        <Input label="Modifier Value" type="number" value={form.modifierValue} onChange={(v) => set('modifierValue', v)} readOnly={readOnly} />
        <Input label="Modifier Type" value={form.modifierType} onChange={(v) => set('modifierType', v)} readOnly={readOnly} />
        <Input label="Approval Status" value={form.approvalStatus} onChange={(v) => set('approvalStatus', v)} readOnly={readOnly} />
        <TextArea label="Basis" value={form.basis} onChange={(v) => set('basis', v)} readOnly={readOnly} />
        <TextArea label="Source / Reference" value={form.sourceReference} onChange={(v) => set('sourceReference', v)} readOnly={readOnly} />
        <TextArea label="Engineering Justification" value={form.engineeringJustification} onChange={(v) => set('engineeringJustification', v)} readOnly={readOnly} />
      </div>
      {!readOnly ? <button className="lopa-button-primary mt-3 disabled:opacity-50" disabled={saving} onClick={onSave}>{saving ? 'Saving...' : 'Save Site Modifier'}</button> : null}
    </LopaPanel>
  );
}

function ConditionalModifierSelectionPanel({ id, readOnly, onSelected }: { id: string; readOnly: boolean; onSelected: () => void }) {
  return (
    <LopaPanel title="Conditional Modifier Selection">
      <p className="mb-3 text-xs text-slate-400">Select one or more approved conditional modifiers. Values are snapshotted into this study and can be overridden only with policy permission and justification.</p>
      {readOnly ? <Empty text="Read-only study. Reopen before selecting modifiers." /> : <ConditionalModifierLibrarySelector studyId={id} onSelected={onSelected} />}
    </LopaPanel>
  );
}

function SelectedModifiersPanel({ data, readOnly, update, archive }: { data: LopaInitiatingEventTabData; readOnly: boolean; update: (id: string, values: Record<string, any>) => void; archive: (id: string) => void }) {
  return (
    <LopaPanel title="Selected Conditional Modifiers">
      {data.modifiers.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Modifier</th><th>Type</th><th>Value</th><th>Range</th><th>Status</th><th /></tr></thead><tbody>{data.modifiers.map((modifier: any) => <tr key={modifier.id} className="border-t border-cyan-300/10"><td className="py-3 font-semibold text-white">{modifier.modifier_code} - {modifier.modifier_name}</td><td>{modifier.modifier_type ?? '-'}</td><td>{modifier.selected_value ?? '-'}</td><td>{modifier.low_value ?? '-'} / {modifier.high_value ?? '-'}</td><td><TonePill tone={modifier.engineering_justification ? 'success' : 'warning'}>{modifier.engineering_justification ? 'Justified' : 'Needs basis'}</TonePill></td><td className="text-right">{!readOnly ? <div className="flex justify-end gap-2"><button className="text-xs text-cyan-200" onClick={() => { const next = window.prompt('Selected modifier value', String(modifier.selected_value ?? '')); if (next) update(modifier.id, { selectedValue: Number(next), engineeringJustification: modifier.engineering_justification ?? 'Updated from Initiating Event tab' }); }}>Edit</button><button className="text-red-200" onClick={() => archive(modifier.id)}><Trash2 size={14} /></button></div> : null}</td></tr>)}</tbody></table></div> : <Empty text="No conditional modifiers selected yet." />}
    </LopaPanel>
  );
}

function FrequencySnapshotPanel({ data }: { data: LopaInitiatingEventTabData }) {
  const snapshot = data.frequencySnapshot;
  return (
    <LopaPanel title="Frequency Snapshot / Basis" action={<Calculator size={16} className="text-cyan-200" />}>
      <FieldGrid items={[
        ['Input method', snapshot.inputMethod],
        ['Base frequency used', formatNumber(snapshot.baseFrequencyUsed)],
        ['Site modifier used', snapshot.siteModifierUsed],
        ['Frequency before modifiers', formatNumber(snapshot.finalFrequencyBeforeConditionalModifiers)],
        ['Combined modifier factor', formatNumber(snapshot.combinedModifierFactor)],
        ['Frequency after modifiers', formatNumber(snapshot.finalFrequencyAfterConditionalModifiers)],
        ['Confidence low/high', `${formatNumber(snapshot.confidenceRange?.low)} / ${formatNumber(snapshot.confidenceRange?.high)}`],
        ['Source references', (snapshot.sourceReferences ?? []).join(', ') || '-']
      ]} />
    </LopaPanel>
  );
}

function ReadinessPanel({ readiness, onComplete, busy, readOnly }: any) {
  return (
    <LopaPanel title="Initiating Event Readiness" action={<button className="lopa-button-secondary disabled:opacity-50" disabled={busy || readOnly || readiness.status === 'Blocked'} onClick={onComplete}><CheckCircle2 size={14} />Mark Complete</button>}>
      <div className="mb-4 flex items-center gap-3"><div className="text-3xl font-black text-white">{readiness.completionPercent ?? 0}%</div><div className="flex-1"><ProgressBar value={readiness.completionPercent ?? 0} tone={readiness.status === 'Blocked' ? 'danger' : readiness.status === 'Warning' ? 'warning' : 'success'} /></div><TonePill tone={toneFor(readiness.status)}>{readiness.status}</TonePill></div>
      <div className="space-y-2">{readiness.checklist.map((check: any) => <div key={check.key} className="flex items-center justify-between gap-3 rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm"><span>{check.label}</span><TonePill tone={check.complete ? 'success' : check.status === 'Warning' ? 'warning' : 'danger'}>{check.status}</TonePill></div>)}</div>
    </LopaPanel>
  );
}

function NotesPanel({ data, note, setNote, addNote, deleteNote, readOnly }: any) {
  return (
    <LopaPanel title="Initiating Event Notes & Assumptions">
      {!readOnly ? <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]"><input className={inputClass} placeholder="Add initiating event note, assumption, source concern, or open question..." value={note} onChange={(event) => setNote(event.target.value)} /><button className="lopa-button-primary" onClick={addNote}>Add Note</button></div> : null}
      {data.notes.length ? <div className="space-y-2">{data.notes.map((item: any) => <div key={item.id} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3"><div className="flex items-center justify-between gap-2"><TonePill>{item.note_type ?? 'General'}</TonePill>{!readOnly ? <button className="text-xs text-red-200" onClick={() => deleteNote(item.id)}>Archive</button> : null}</div><p className="mt-2 text-sm text-slate-200">{item.note_text}</p></div>)}</div> : <Empty text="No initiating event notes yet." />}
    </LopaPanel>
  );
}

function ActionsPanel({ data, onSelectTab }: { data: LopaInitiatingEventTabData; onSelectTab: ((tab: string) => void) | undefined }) {
  return (
    <LopaPanel title="Initiating Event Actions">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <ActionButton label="Review IPL candidates" onClick={() => onSelectTab?.('ipls')} />
        <ActionButton label="Run calculation" onClick={() => onSelectTab?.('risk-calculation')} />
        <ActionButton label="Create action / recommendation" onClick={() => onSelectTab?.('actions')} />
        <ActionButton label="Review source snapshot" onClick={() => onSelectTab?.('overview')} />
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

function toneFor(value?: any) {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('ready') || text.includes('complete') || text.includes('approved') || text.includes('documented') || text.includes('referenced')) return 'success';
  if (text.includes('block') || text.includes('missing') || text.includes('failed')) return 'danger';
  if (text.includes('warning') || text.includes('manual') || text.includes('review')) return 'warning';
  return 'info';
}

function formatNumber(value: any) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number.toExponential(2) : value ?? '-';
}
