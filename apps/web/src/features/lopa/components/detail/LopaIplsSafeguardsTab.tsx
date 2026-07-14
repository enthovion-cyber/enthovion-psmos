'use client';

import { Plus, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useLopaIplsSafeguards, useLopaIplsSafeguardsMutations } from '../../hooks/useLopaIplsSafeguards';
import { lopaIplCandidateSchema, lopaStudySafeguardSchema } from '../../schemas/lopa-ipls-safeguards.schema';
import type { LopaIplCandidate, LopaIplsSafeguardsFilters, LopaStudySafeguard } from '../../types/lopa-ipls-safeguards.types';
import { inputClass, LibraryDialog, LibraryField, selectClass } from '../libraries/LibraryShared';
import { HazopImportedSafeguardsPanel } from '../ipls-safeguards/HazopImportedSafeguardsPanel';
import { IplCandidateRegister } from '../ipls-safeguards/IplCandidateRegister';
import { IplFiltersBar } from '../ipls-safeguards/IplFiltersBar';
import { IplGapsActionsPanel } from '../ipls-safeguards/IplGapsActionsPanel';
import { IplReadinessPanel } from '../ipls-safeguards/IplReadinessPanel';
import { LopaIplSummaryCards } from '../ipls-safeguards/LopaIplSummaryCards';
import { SelectIplRegistryPanel } from '../ipls-safeguards/SelectIplRegistryPanel';
import { StudySafeguardsRegister } from '../ipls-safeguards/StudySafeguardsRegister';
import { IplValidationDrawer } from '../ipls-safeguards/IplValidationDrawer';

export function LopaIplsSafeguardsTab({ id }: { id: string }) {
  const [filters, setFilters] = useState<LopaIplsSafeguardsFilters>({});
  const query = useLopaIplsSafeguards(id, filters);
  const mutations = useLopaIplsSafeguardsMutations(id);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<LopaIplCandidate | null>(null);
  const [safeguardOpen, setSafeguardOpen] = useState(false);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [safeguardForm, setSafeguardForm] = useState<Record<string, any>>({ sourceType: 'Manual', proposedUse: 'Safeguard only' });
  const [candidateForm, setCandidateForm] = useState<Record<string, any>>({ sourceType: 'Manual' });

  const data = query.data;
  const readOnly = !!data?.readOnly;

  function fail(err: any, fallback: string) {
    const raw = err?.response?.data?.message ?? err?.message ?? fallback;
    setError(typeof raw === 'string' ? raw : JSON.stringify(raw));
  }

  function saveSafeguard() {
    const parsed = lopaStudySafeguardSchema.safeParse(safeguardForm);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Safeguard validation failed.');
    mutations.createSafeguard.mutate(parsed.data, {
      onSuccess: () => {
        setSafeguardOpen(false);
        setSafeguardForm({ sourceType: 'Manual', proposedUse: 'Safeguard only' });
        setMessage('Safeguard saved.');
      },
      onError: (err) => fail(err, 'Could not save safeguard.')
    });
  }

  function saveCandidate() {
    const parsed = lopaIplCandidateSchema.safeParse(candidateForm);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'IPL candidate validation failed.');
    mutations.createCandidate.mutate(parsed.data, {
      onSuccess: () => {
        setCandidateOpen(false);
        setCandidateForm({ sourceType: 'Manual' });
        setMessage('IPL candidate saved.');
      },
      onError: (err) => fail(err, 'Could not save IPL candidate.')
    });
  }

  function upgrade(row: LopaStudySafeguard) {
    mutations.markCandidate.mutate({
      safeguardId: row.id,
      values: { safeguardId: row.id, iplName: row.safeguard_name, iplType: row.safeguard_type, sourceType: row.source_type, sourceReference: row.safeguard_number }
    }, { onSuccess: () => setMessage('Safeguard upgraded to IPL candidate.'), onError: (err) => fail(err, 'Could not upgrade safeguard.') });
  }

  if (query.isLoading) return <State text="Loading IPLs / Safeguards from API..." />;
  if (query.isError || !data) return <State text="Unable to load IPLs / Safeguards. Check API permissions and LOPA schema." tone="error" />;

  return (
    <div className="space-y-4">
      {message ? <Toast text={message} tone="success" onClose={() => setMessage(null)} /> : null}
      {error ? <Toast text={error} tone="danger" onClose={() => setError(null)} /> : null}
      {readOnly ? <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">This LOPA study is read-only. Reopen it before changing safeguards or credited IPLs.</div> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">IPLs / Safeguards</h2>
          <p className="text-sm text-slate-400">Separate safeguards, IPL candidates, validated IPLs, and credited IPLs with backend validation controls.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={() => setSafeguardOpen(true)}><Plus size={15} />Add Safeguard</button>
          <button className="lopa-button-primary disabled:opacity-50" disabled={readOnly} onClick={() => setCandidateOpen(true)}><ShieldCheck size={15} />Add Manual IPL</button>
        </div>
      </div>
      <LopaIplSummaryCards summary={data.summary} />
      <IplFiltersBar filters={filters} setFilters={setFilters} context={data.context} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <HazopImportedSafeguardsPanel
          rows={data.importedHazopSafeguards}
          readOnly={readOnly}
          importing={mutations.importHazop.isPending}
          onImport={() => mutations.importHazop.mutate(undefined, { onSuccess: () => setMessage('HAZOP safeguards imported.'), onError: (err) => fail(err, 'Import failed.') })}
          onUpgrade={upgrade}
          onReject={(row) => mutations.rejectSafeguard.mutate({ safeguardId: row.id, reason: window.prompt('Why reject this safeguard as an IPL?') || 'Rejected from IPL credit' }, { onSuccess: () => setMessage('Safeguard rejected for IPL credit.'), onError: (err) => fail(err, 'Reject failed.') })}
        />
        <SelectIplRegistryPanel context={data.context} readOnly={readOnly} onSelect={(registryId) => mutations.selectRegistry.mutate(registryId, { onSuccess: () => setMessage('Registry IPL snapshot selected.'), onError: (err) => fail(err, 'Registry selection failed.') })} />
      </div>
      <StudySafeguardsRegister rows={data.safeguards} />
      <IplCandidateRegister
        rows={data.candidates}
        readOnly={readOnly}
        onOpen={setSelectedCandidate}
        onStartValidation={(row) => mutations.startValidation.mutate(row.id, { onSuccess: () => setMessage('Validation started.'), onError: (err) => fail(err, 'Start validation failed.') })}
        onSubmitValidation={(row) => mutations.submitValidation.mutate(row.id, { onSuccess: () => setMessage('Validation submitted.'), onError: (err) => fail(err, 'Submit validation failed.') })}
        onCredit={(row) => mutations.approveCredit.mutate({ candidateId: row.id, reason: window.prompt('Credit approval note') || undefined }, { onSuccess: () => setMessage('IPL credited for future calculation.'), onError: (err) => fail(err, 'Credit failed.') })}
        onUncredit={(row) => mutations.removeCredit.mutate({ candidateId: row.id, reason: window.prompt('Reason for removing credit') || undefined }, { onSuccess: () => setMessage('IPL credit removed.'), onError: (err) => fail(err, 'Uncredit failed.') })}
        onReject={(row) => mutations.rejectCandidate.mutate({ candidateId: row.id, reason: window.prompt('Reason for rejecting IPL candidate') || undefined }, { onSuccess: () => setMessage('IPL candidate rejected.'), onError: (err) => fail(err, 'Reject failed.') })}
        onReopen={(row) => mutations.reopenValidation.mutate({ candidateId: row.id, reason: window.prompt('Reason for reopening validation') || undefined }, { onSuccess: () => setMessage('IPL validation reopened.'), onError: (err) => fail(err, 'Reopen failed.') })}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <IplReadinessPanel readiness={data.readiness} />
        <IplGapsActionsPanel gaps={data.gaps} readOnly={readOnly} creating={mutations.createGapActions.isPending} onCreateActions={() => mutations.createGapActions.mutate(undefined, { onSuccess: () => setMessage('IPL gaps recorded for action tracking.'), onError: (err) => fail(err, 'Could not create gap actions.') })} />
      </div>
      <IplValidationDrawer candidate={selectedCandidate} open={!!selectedCandidate} onClose={() => setSelectedCandidate(null)} />
      <AddSafeguardDialog open={safeguardOpen} onClose={() => setSafeguardOpen(false)} form={safeguardForm} setForm={setSafeguardForm} context={data.context} onSave={saveSafeguard} saving={mutations.createSafeguard.isPending} />
      <AddCandidateDialog open={candidateOpen} onClose={() => setCandidateOpen(false)} form={candidateForm} setForm={setCandidateForm} context={data.context} onSave={saveCandidate} saving={mutations.createCandidate.isPending} />
    </div>
  );
}

function AddSafeguardDialog({ open, onClose, form, setForm, context, onSave, saving }: any) {
  const update = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));
  return (
    <LibraryDialog title="Add Study Safeguard" subtitle="Safeguards are not credited until upgraded and validated as IPLs." open={open} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LibraryField label="Safeguard name"><input className={inputClass} value={form.safeguardName ?? ''} onChange={(e) => update('safeguardName', e.target.value)} /></LibraryField>
        <LibraryField label="Safeguard type"><select className={selectClass} value={form.safeguardType ?? ''} onChange={(e) => update('safeguardType', e.target.value)}><option value="">Select type</option>{context.safeguardTypes.map((type: string) => <option key={type}>{type}</option>)}</select></LibraryField>
        <LibraryField label="Source"><select className={selectClass} value={form.sourceType ?? 'Manual'} onChange={(e) => update('sourceType', e.target.value)}><option>Manual</option><option>HAZOP</option><option>Equipment Registry</option><option>Document Control</option></select></LibraryField>
        <LibraryField label="Proposed use"><select className={selectClass} value={form.proposedUse ?? 'Safeguard only'} onChange={(e) => update('proposedUse', e.target.value)}>{context.proposedUses.map((type: string) => <option key={type}>{type}</option>)}</select></LibraryField>
        <LibraryField label="Description"><textarea className={inputClass} rows={3} value={form.description ?? ''} onChange={(e) => update('description', e.target.value)} /></LibraryField>
        <LibraryField label="Notes"><textarea className={inputClass} rows={3} value={form.notes ?? ''} onChange={(e) => update('notes', e.target.value)} /></LibraryField>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="lopa-button-secondary" onClick={onClose}>Cancel</button><button className="lopa-button-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving...' : 'Save Safeguard'}</button></div>
    </LibraryDialog>
  );
}

function AddCandidateDialog({ open, onClose, form, setForm, context, onSave, saving }: any) {
  const update = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));
  return (
    <LibraryDialog title="Add Manual IPL Candidate" subtitle="Manual IPL candidates require source reference, PFD/RRF basis, and later validation before credit." open={open} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LibraryField label="IPL name"><input className={inputClass} value={form.iplName ?? ''} onChange={(e) => update('iplName', e.target.value)} /></LibraryField>
        <LibraryField label="IPL type"><select className={selectClass} value={form.iplType ?? ''} onChange={(e) => update('iplType', e.target.value)}><option value="">Select type</option>{context.safeguardTypes.map((type: string) => <option key={type}>{type}</option>)}</select></LibraryField>
        <LibraryField label="Protection function"><input className={inputClass} value={form.protectionFunction ?? ''} onChange={(e) => update('protectionFunction', e.target.value)} /></LibraryField>
        <LibraryField label="Preventive / mitigative"><select className={selectClass} value={form.preventiveOrMitigative ?? ''} onChange={(e) => update('preventiveOrMitigative', e.target.value)}><option value="">Select</option><option>Preventive</option><option>Mitigative</option><option>Both</option></select></LibraryField>
        <LibraryField label="PFDavg"><input className={inputClass} value={form.pfdavg ?? ''} onChange={(e) => update('pfdavg', e.target.value)} /></LibraryField>
        <LibraryField label="RRF"><input className={inputClass} value={form.rrf ?? ''} onChange={(e) => update('rrf', e.target.value)} /></LibraryField>
        <LibraryField label="Source reference"><input className={inputClass} value={form.sourceReference ?? ''} onChange={(e) => update('sourceReference', e.target.value)} /></LibraryField>
        <LibraryField label="Proof-test basis"><input className={inputClass} value={form.proofTestBasis ?? ''} onChange={(e) => update('proofTestBasis', e.target.value)} /></LibraryField>
        <LibraryField label="Notes"><textarea className={inputClass} rows={3} value={form.notes ?? ''} onChange={(e) => update('notes', e.target.value)} /></LibraryField>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="lopa-button-secondary" onClick={onClose}>Cancel</button><button className="lopa-button-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving...' : 'Save IPL Candidate'}</button></div>
    </LibraryDialog>
  );
}

function Toast({ text, tone, onClose }: { text: string; tone: 'success' | 'danger'; onClose: () => void }) {
  return <div className={`flex items-center justify-between rounded-xl border p-3 text-sm ${tone === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100' : 'border-red-400/20 bg-red-500/10 text-red-100'}`}><span>{text}</span><button onClick={onClose}>Close</button></div>;
}

function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) {
  return <div className={`rounded-xl border p-6 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-300/10 bg-[#071525] text-slate-400'}`}>{text}</div>;
}
