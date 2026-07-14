'use client';

import { useState, type ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useLopaSilDetermination, useLopaSilDeterminationMutations } from '../../hooks/useLopaSilDetermination';
import { SilSummaryCards } from '../sil-determination/SilSummaryCards';
import { SilReadinessBlockersPanel } from '../sil-determination/SilReadinessBlockersPanel';
import { SilRiskCalculationSnapshotPanel } from '../sil-determination/SilRiskCalculationSnapshotPanel';
import { SilDeterminationHeader } from '../sil-determination/SilDeterminationHeader';
import { RequiredRiskReductionPanel } from '../sil-determination/RequiredRiskReductionPanel';
import { SilTargetDeterminationPanel } from '../sil-determination/SilTargetDeterminationPanel';
import { SilMethodologyBasisPanel } from '../sil-determination/SilMethodologyBasisPanel';
import { ExistingSifAssessmentPanel } from '../sil-determination/ExistingSifAssessmentPanel';
import { NewSifRequirementPanel } from '../sil-determination/NewSifRequirementPanel';
import { SifSpecificationPanel } from '../sil-determination/SifSpecificationPanel';
import { SifArchitectureVotingPanel } from '../sil-determination/SifArchitectureVotingPanel';
import { SifComponentsPanel } from '../sil-determination/SifComponentsPanel';
import { SafeStateTripSetpointPanel } from '../sil-determination/SafeStateTripSetpointPanel';
import { SifProofTestBypassPanel } from '../sil-determination/SifProofTestBypassPanel';
import { Iec61511GapChecklistPanel } from '../sil-determination/Iec61511GapChecklistPanel';
import { SifLinksPanel } from '../sil-determination/SifLinksPanel';
import { SilSifActionsPanel } from '../sil-determination/SilSifActionsPanel';
import { SilSnapshotVersionPanel } from '../sil-determination/SilSnapshotVersionPanel';
import { SilReassessmentImpactPanel } from '../sil-determination/SilReassessmentImpactPanel';
import { SilDeterminationFilters } from '../sil-determination/SilDeterminationFilters';
import { CreateSilActionDialog, DetermineSilDialog, LinkSifRecordDialog, SifSpecificationDialog } from '../sil-determination/SilDialogs';
import { SifEngineeringEditors } from '../sil-determination/SifEngineeringEditors';

type Dialog = 'determine' | 'reassess' | 'lock' | 'unlock' | 'sif' | 'link' | 'action' | null;

export function LopaSilDeterminationTab({ id }: { id: string }) {
  const query = useLopaSilDetermination(id);
  const mutations = useLopaSilDeterminationMutations(id);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fail = (err: any, fallback: string) => {
    const message = err?.response?.data?.message ?? err?.message ?? fallback;
    setError(Array.isArray(message) ? message.join('. ') : typeof message === 'string' ? message : JSON.stringify(message));
  };

  if (query.isLoading) return <State icon={<Loader2 className="animate-spin"/>} text="Loading SIL determination, calculation basis, SIFs, evidence and readiness..."/>;
  if (query.isError || !query.data) return <State tone="error" icon={<AlertCircle/>} text="Unable to load SIL Determination / SIF Specification. Confirm the SIL migration is applied and that you have access."/>;

  const data = query.data;
  const busy = Object.values(mutations).some((mutation: any) => mutation?.isPending);
  const term = search.trim().toLowerCase();
  const matches = (value: any) => !term || JSON.stringify(value ?? {}).toLowerCase().includes(term);
  const sifs = data.sifs.filter(matches);
  const gaps = data.gaps.filter(matches);
  const links = data.links.filter(matches);
  const actions = data.actions.filter(matches);
  const primarySif = data.sifs[0] ?? null;
  const architecture = primarySif ? data.architectures.find((row: any) => row.sif_specification_id === primarySif.id) : null;
  const proofTest = primarySif ? data.proofTests.find((row: any) => row.sif_specification_id === primarySif.id) : null;
  const canDetermine = Boolean(data.riskCalculation && ['Calculated', 'Locked'].includes(data.riskCalculation.calculation_status) && data.riskCalculation.result_status !== 'Needs Recalculation');
  const lockReason = data.readiness.status === 'Ready' ? undefined : 'Resolve every backend readiness blocker before locking the SIL basis.';
  const run = (action: () => void, success: string) => { action(); setNotice(success); };

  return <div className="space-y-4">
    {notice ? <Banner tone="success" text={notice} onClose={() => setNotice(null)}/> : null}
    {error ? <Banner tone="danger" text={error} onClose={() => setError(null)}/> : null}
    {data.readOnly ? <Banner tone="warning" text="Read-only: the study is approved/closed or the SIL basis is locked. Unlock or reopen through its controlled workflow before editing."/> : null}
    {data.header.needsReassessment ? <Banner tone="warning" text="Needs Reassessment: a Risk Calculation, credited IPL, tolerable-risk, SIF, or evidence change has affected the SIL basis."/> : null}
    <SilDeterminationHeader header={data.header} readOnly={data.readOnly} busy={busy} canDetermine={canDetermine} {...(lockReason ? { lockDisabledReason: lockReason } : {})} onDetermine={() => setDialog('determine')} onReassess={() => setDialog('reassess')} onLock={() => setDialog('lock')} onUnlock={() => setDialog('unlock')}/>
    <SilDeterminationFilters value={search} onChange={setSearch}/>
    <SilSummaryCards summary={data.summary}/>
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2"><SilReadinessBlockersPanel readiness={data.readiness}/><SilRiskCalculationSnapshotPanel calculation={data.riskCalculation}/></div>
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3"><RequiredRiskReductionPanel calculation={data.riskCalculation} determination={data.determination}/><SilTargetDeterminationPanel determination={data.determination}/><SilMethodologyBasisPanel methodology={data.methodology} determination={data.determination}/></div>
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2"><ExistingSifAssessmentPanel determination={data.determination}/><NewSifRequirementPanel determination={data.determination}/></div>
    <SifSpecificationPanel sifs={sifs} components={data.components} proofTests={data.proofTests} readOnly={data.readOnly} onAdd={() => setDialog('sif')}/>
    {primarySif ? <><div className="grid grid-cols-1 gap-4 2xl:grid-cols-2"><SifArchitectureVotingPanel architecture={architecture}/><SifComponentsPanel components={data.components.filter((row: any) => row.sif_specification_id === primarySif.id)}/><SafeStateTripSetpointPanel sif={primarySif}/><SifProofTestBypassPanel proofTest={proofTest}/></div><SifEngineeringEditors sif={primarySif} readOnly={data.readOnly} onComponent={(values) => mutations.addComponent.mutate({ sifId: primarySif.id, values }, { onSuccess: () => setNotice('SIF component saved; SIL is marked for reassessment.'), onError: (e) => fail(e, 'Could not save SIF component.') })} onArchitecture={(values) => mutations.updateArchitecture.mutate({ sifId: primarySif.id, values }, { onSuccess: () => setNotice('SIF architecture saved; SIL is marked for reassessment.'), onError: (e) => fail(e, 'Could not save SIF architecture.') })} onProofTest={(values) => mutations.updateProofTest.mutate({ sifId: primarySif.id, values }, { onSuccess: () => setNotice('Proof-test / bypass basis saved; SIL is marked for reassessment.'), onError: (e) => fail(e, 'Could not save proof-test basis.') })}/></> : null}
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2"><Iec61511GapChecklistPanel gaps={gaps} readOnly={data.readOnly} onGenerate={() => mutations.generateGaps.mutate(undefined, { onSuccess: () => setNotice('IEC 61511 checklist generated from the configured template.'), onError: (e) => fail(e, 'Could not generate IEC gaps.') })} onComplete={(gapId) => mutations.updateGap.mutate({ gapId, values: { status: 'Complete' } }, { onSuccess: () => setNotice('IEC 61511 gap marked complete.'), onError: (e) => fail(e, 'Could not update IEC gap.') })}/><SifLinksPanel links={links} readOnly={data.readOnly} onAdd={() => setDialog('link')}/></div>
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3"><SilSifActionsPanel actions={actions} readOnly={data.readOnly} onAdd={() => setDialog('action')}/><SilSnapshotVersionPanel snapshots={data.snapshots} onCompare={(snapshotId) => mutations.compareSnapshot.mutate(snapshotId, { onSuccess: (result) => setNotice(`${result.differences?.length ?? 0} difference(s) found against the selected immutable snapshot.`), onError: (e) => fail(e, 'Could not compare the SIL snapshot.') })}/><SilReassessmentImpactPanel events={data.reassessments}/></div>
    {dialog === 'determine' || dialog === 'reassess' || dialog === 'lock' || dialog === 'unlock' ? <DetermineSilDialog mode={dialog} busy={busy} onClose={() => setDialog(null)} onSubmit={(values) => { const mutation = dialog === 'determine' ? mutations.determine : dialog === 'reassess' ? mutations.reassess : dialog === 'lock' ? mutations.lock : mutations.unlock; mutation.mutate(values, { onSuccess: () => { setDialog(null); setNotice(dialog === 'determine' ? 'SIL determined from the configured methodology.' : 'SIL workflow updated.'); }, onError: (e) => fail(e, 'SIL workflow action failed.') }); }}/> : null}
    {dialog === 'sif' ? <SifSpecificationDialog targetSil={data.determination?.target_sil} busy={busy} onClose={() => setDialog(null)} onSubmit={(values) => mutations.createSif.mutate(values, { onSuccess: () => { setDialog(null); setNotice('SIF specification created. Complete components, architecture, links and proof-test basis before locking.'); }, onError: (e) => fail(e, 'Could not create SIF specification.') })}/>: null}
    {dialog === 'link' ? <LinkSifRecordDialog busy={busy} onClose={() => setDialog(null)} onSubmit={(values) => mutations.addLink.mutate(values, { onSuccess: () => { setDialog(null); setNotice('SIF/SIL record linked with a source snapshot.'); }, onError: (e) => fail(e, 'Could not link the record.') })}/>: null}
    {dialog === 'action' ? <CreateSilActionDialog busy={busy} onClose={() => setDialog(null)} onSubmit={(values) => mutations.createAction.mutate(values, { onSuccess: () => { setDialog(null); setNotice('Universal Action created and linked to SIL/SIF.'); }, onError: (e) => fail(e, 'Could not create the Universal Action.') })}/>: null}
  </div>;
}

function State({ text, tone = 'muted', icon }: { text: string; tone?: 'muted' | 'error'; icon: ReactNode }) { return <div className={`flex items-center gap-3 rounded-lg border p-6 text-sm ${tone === 'error' ? 'border-red-400/30 bg-red-500/10 text-red-800 dark:text-red-100' : 'border-slate-200 bg-white text-slate-600 dark:border-cyan-300/10 dark:bg-[#071525] dark:text-slate-400'}`}>{icon}{text}</div>; }
function Banner({ text, tone, onClose }: { text: string; tone: 'success' | 'danger' | 'warning'; onClose?: () => void }) { const colour = tone === 'success' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100' : tone === 'danger' ? 'border-red-400/30 bg-red-500/10 text-red-800 dark:text-red-100' : 'border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-100'; return <div className={`flex justify-between gap-3 rounded-lg border p-3 text-sm ${colour}`}><span>{text}</span>{onClose ? <button className="text-xs font-bold" onClick={onClose}>Dismiss</button> : null}</div>; }
