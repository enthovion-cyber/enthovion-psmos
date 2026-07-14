'use client';

import { Field, SelectField, TextArea, ToggleGrid, buttonPrimary, buttonSecondary } from '../shared/IncidentTabPrimitives';

const barrierTypes = ['SIS / SIF', 'PSV / Relief Device', 'Alarm with Operator Response', 'Operator Manual Response', 'Mechanical / Electrical Interlock', 'BPCS Independent Function', 'ESD Function', 'Fire and Gas Detection / Action', 'Deluge / Fire Protection', 'Passive Protection', 'Dike / Bund / Secondary Containment', 'Blast Wall / Fireproofing', 'Check Valve', 'Flame Arrestor', 'Ventilation', 'Physical Separation', 'Procedure / PTW', 'PPE', 'Emergency Response', 'Other'];
const performance = ['Performed', 'Degraded', 'Failed', 'Bypassed', 'Missing', 'Not demanded', 'Not determined'];
const yesNoUnknown = ['Yes', 'No', 'Unknown'];

export function AddEditBarrierDrawer({ open, form, set, saving, onClose, onSave }: any) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-slate-950/40 p-3">
    <aside className="ml-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-cyan-300/10 dark:bg-[#071525]">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-cyan-300/10">
        <div><h3 className="font-black">{form.id ? 'Edit Barrier / Safeguard' : 'Add Barrier / Safeguard'}</h3><p className="text-xs text-slate-500">Capture demand performance, failure mode, IPL credit, SIS/SIF, PSV, alarm, PTW, PPE/emergency response, evidence, RCA, and follow-up fields.</p></div>
        <button className={buttonSecondary} onClick={onClose}>Close</button>
      </div>
      <div className="grid flex-1 gap-4 overflow-auto p-4 lg:grid-cols-2">
        <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10">
          <h4 className="text-sm font-black">Core Barrier Details</h4>
          <Field label="Barrier name" value={form.barrierName} onChange={(v) => set('barrierName', v)} />
          <SelectField label="Barrier type" value={form.barrierType} options={barrierTypes} onChange={(v) => set('barrierType', v)} />
          <TextArea label="Expected function" value={form.expectedFunction} onChange={(v) => set('expectedFunction', v)} />
          <Field label="Related hazard" value={form.relatedHazard} onChange={(v) => set('relatedHazard', v)} />
          <Field label="Equipment ID" value={form.equipmentId} onChange={(v) => set('equipmentId', v)} />
          <Field label="Chemical ID" value={form.chemicalId} onChange={(v) => set('chemicalId', v)} />
          <Field label="HAZOP scenario ID" value={form.hazopScenarioId} onChange={(v) => set('hazopScenarioId', v)} />
          <Field label="LOPA / IPL record ID" value={form.iplRecordId} onChange={(v) => set('iplRecordId', v)} />
        </section>
        <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10">
          <h4 className="text-sm font-black">Demand / Performance / Failure</h4>
          <SelectField label="Demand occurred" value={form.demandOccurred} options={yesNoUnknown} onChange={(v) => set('demandOccurred', v)} />
          <Field label="Demand date/time" type="datetime-local" value={form.demandAt} onChange={(v) => set('demandAt', v)} />
          <TextArea label="Expected response" value={form.expectedResponse} onChange={(v) => set('expectedResponse', v)} />
          <TextArea label="Actual response" value={form.actualResponse} onChange={(v) => set('actualResponse', v)} />
          <Field label="Response time (HH:MM:SS)" value={form.responseTime} onChange={(v) => set('responseTime', v)} />
          <SelectField label="Performance status" value={form.performanceStatus} options={performance} onChange={(v) => set('performanceStatus', v)} />
          <Field label="Failure mode" value={form.failureMode} onChange={(v) => set('failureMode', v)} />
          <TextArea label="Failure description" value={form.failureDescription} onChange={(v) => set('failureDescription', v)} />
          <Field label="Immediate cause" value={form.immediateCause} onChange={(v) => set('immediateCause', v)} />
          <Field label="Contributing cause" value={form.contributingCause} onChange={(v) => set('contributingCause', v)} />
          <ToggleGrid form={form} set={set} keys={[['partialResponse', 'Partial response'], ['lateResponse', 'Late response'], ['noResponse', 'No response'], ['followupRequired', 'Follow-up required']]} />
        </section>
        <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10">
          <h4 className="text-sm font-black">IPL / LOPA / SIS / PSV</h4>
          <SelectField label="Credited IPL" value={form.creditedIpl} options={['Yes', 'No', 'Not Determined', 'Study Validation Required']} onChange={(v) => set('creditedIpl', v)} />
          <Field label="IPL type" value={form.iplType} onChange={(v) => set('iplType', v)} />
          <Field label="PFDavg snapshot" value={form.pfdavgSnapshot} onChange={(v) => set('pfdavgSnapshot', v)} />
          <Field label="RRF snapshot" value={form.rrfSnapshot} onChange={(v) => set('rrfSnapshot', v)} />
          <Field label="Proof test status" value={form.proofTestStatus} onChange={(v) => set('proofTestStatus', v)} />
          <Field label="Last proof test" type="date" value={form.lastProofTest} onChange={(v) => set('lastProofTest', v)} />
          <Field label="SIF tag" value={form.sifTag} onChange={(v) => set('sifTag', v)} />
          <Field label="Trip setpoint" value={form.tripSetpoint} onChange={(v) => set('tripSetpoint', v)} />
          <Field label="PSV tag" value={form.psvTag} onChange={(v) => set('psvTag', v)} />
          <Field label="Set pressure" value={form.setPressure} onChange={(v) => set('setPressure', v)} />
          <Field label="Last inspection/test" type="date" value={form.lastInspectionTest} onChange={(v) => set('lastInspectionTest', v)} />
          <ToggleGrid form={form} set={set} keys={[['lopaReviewRequired', 'LOPA review required'], ['sisSifInvolved', 'SIS/SIF involved'], ['sifFailedDegradedBypassed', 'SIF failed/degraded/bypassed'], ['silImpactReviewRequired', 'SIL impact review required'], ['psvReliefInvolved', 'PSV/relief involved'], ['psvFailedToLift', 'PSV failed to lift'], ['inspectionOverdue', 'Inspection overdue'], ['miFollowupRequired', 'MI follow-up required']]} />
        </section>
        <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10">
          <h4 className="text-sm font-black">Alarm / Procedure / PTW / PPE / Emergency</h4>
          <Field label="Alarm tag" value={form.alarmTag} onChange={(v) => set('alarmTag', v)} />
          <Field label="Alarm priority" value={form.alarmPriority} onChange={(v) => set('alarmPriority', v)} />
          <SelectField label="Alarm activated" value={form.alarmActivated} options={yesNoUnknown} onChange={(v) => set('alarmActivated', v)} />
          <SelectField label="Alarm acknowledged" value={form.alarmAcknowledged} options={yesNoUnknown} onChange={(v) => set('alarmAcknowledged', v)} />
          <SelectField label="Procedure followed" value={form.procedureFollowed} options={yesNoUnknown} onChange={(v) => set('procedureFollowed', v)} />
          <SelectField label="PTW issued" value={form.ptwIssued} options={yesNoUnknown} onChange={(v) => set('ptwIssued', v)} />
          <SelectField label="Isolation completed" value={form.isolationCompleted} options={yesNoUnknown} onChange={(v) => set('isolationCompleted', v)} />
          <SelectField label="PPE used" value={form.ppeUsed} options={yesNoUnknown} onChange={(v) => set('ppeUsed', v)} />
          <SelectField label="Emergency response activated" value={form.emergencyResponseActivated} options={yesNoUnknown} onChange={(v) => set('emergencyResponseActivated', v)} />
          <TextArea label="Notes / change reason" value={form.notes} onChange={(v) => set('notes', v)} />
          <ToggleGrid form={form} set={set} keys={[['alarmInterlockInvolved', 'Alarm/interlock involved'], ['alarmMissedSuppressedFlooded', 'Alarm missed/suppressed/flooded'], ['procedureRequired', 'Procedure required'], ['ptwRequired', 'PTW required'], ['isolationLotoRequired', 'Isolation/LOTO required'], ['ppeRequired', 'PPE required'], ['ppeFailed', 'PPE failed'], ['emergencyResponseRequired', 'Emergency response required'], ['fireGasDetectionInvolved', 'Fire/gas detection involved']]} />
        </section>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-cyan-300/10">
        <button className={buttonSecondary} onClick={onClose}>Cancel</button>
        <button className={buttonPrimary} disabled={saving} onClick={onSave}>Save Barrier</button>
      </div>
    </aside>
  </div>;
}
