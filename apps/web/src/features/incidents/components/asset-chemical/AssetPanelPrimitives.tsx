import { ReactNode } from 'react';
import { Field, InfoRows, ReadOnlyFact, SelectField, TabPanel, TextArea, ToggleGrid, formatDate } from '../shared/IncidentTabPrimitives';
import { Badge } from '../shared/IncidentStatusBadge';

export const equipmentStatuses = ['Running', 'Stopped', 'Isolated', 'Failed', 'Damaged', 'Unknown', 'Not applicable'];
export const materialStates = ['Gas', 'Liquid', 'Solid', 'Two-phase', 'Vapor', 'Aerosol', 'Unknown'];

export function DrawerShell({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-slate-950/60 p-3"><div className="ml-auto flex h-full max-w-2xl flex-col overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-cyan-300/10 dark:bg-[#071525]"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-black">{title}</h2><button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-cyan-300/10">Close</button></div>{children}</div></div>;
}

export function EquipmentForm({ form, set }: { form: any; set: (key: string, value: any) => void }) {
  return <div className="grid gap-3 md:grid-cols-2"><Field label="Equipment tag" value={form.equipmentTag} onChange={(v) => set('equipmentTag', v)} /><Field label="Equipment name" value={form.equipmentName} onChange={(v) => set('equipmentName', v)} /><Field label="Equipment type" value={form.equipmentType} onChange={(v) => set('equipmentType', v)} /><SelectField label="Equipment status" value={form.equipmentStatus} options={equipmentStatuses} onChange={(v) => set('equipmentStatus', v)} /><Field label="Condition at event" value={form.conditionAtEvent} onChange={(v) => set('conditionAtEvent', v)} /><Field label="Operating status" value={form.operatingStatus} onChange={(v) => set('operatingStatus', v)} /><Field label="Failure mode" value={form.failureMode} onChange={(v) => set('failureMode', v)} /><Field label="Equipment location" value={form.equipmentLocation} onChange={(v) => set('equipmentLocation', v)} /><Field label="Last inspection date" type="date" value={form.lastInspectionDate} onChange={(v) => set('lastInspectionDate', v)} /><Field label="Proof test due" type="date" value={form.proofTestDue} onChange={(v) => set('proofTestDue', v)} /><div className="md:col-span-2"><ToggleGrid form={form} set={set} keys={[['maintenanceOverdueSuspected','Maintenance overdue suspected'], ['safeguardInvolved','Safeguard involved'], ['safeguardFailed','Safeguard failed'], ['iplInvolved','IPL involved'], ['sisSifInvolved','SIS/SIF involved'], ['psvReliefInvolved','PSV/relief involved'], ['alarmInterlockInvolved','Alarm/interlock involved']]} /></div><TextArea label="Damage description / reason" value={form.damageDescription ?? form.reason} onChange={(v) => set('damageDescription', v)} className="md:col-span-2" /></div>;
}

export function ChemicalForm({ form, set }: { form: any; set: (key: string, value: any) => void }) {
  return <div className="grid gap-3 md:grid-cols-2"><Field label="Chemical/material name" value={form.chemicalName} onChange={(v) => set('chemicalName', v)} /><Field label="CAS number" value={form.casNumber} onChange={(v) => set('casNumber', v)} /><Field label="SDS ID" value={form.sdsId} onChange={(v) => set('sdsId', v)} /><Field label="SDS link" value={form.sdsLink} onChange={(v) => set('sdsLink', v)} /><SelectField label="Material state" value={form.materialState} options={materialStates} onChange={(v) => set('materialState', v)} /><Field label="Hazard classification" value={form.hazardClassification} onChange={(v) => set('hazardClassification', v)} /><Field label="Estimated quantity involved" value={form.estimatedQuantityInvolved} onChange={(v) => set('estimatedQuantityInvolved', v)} /><Field label="Released quantity" value={form.releasedQuantity} onChange={(v) => set('releasedQuantity', v)} /><Field label="Release unit" value={form.releaseUnit} onChange={(v) => set('releaseUnit', v)} /><Field label="Release duration" value={form.releaseDuration} onChange={(v) => set('releaseDuration', v)} /><Field label="Process condition" value={form.processCondition} onChange={(v) => set('processCondition', v)} /><Field label="Containment status" value={form.containmentStatus} onChange={(v) => set('containmentStatus', v)} /><div className="md:col-span-2"><ToggleGrid form={form} set={set} keys={[['sdsAvailable','SDS available'], ['followupRequired','Follow-up required']]} /></div><TextArea label="Reason / notes" value={form.reason} onChange={(v) => set('reason', v)} className="md:col-span-2" /></div>;
}

export function SectionRows({ data, empty }: { data?: any; empty: string }) {
  const rows = data?.rows ?? [];
  if (!rows.length) return <p className="text-xs text-slate-500">{empty}</p>;
  return <div className="grid gap-2">{rows.map((row: any) => <div key={row.id} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><div className="mb-2 font-bold">{row.label}</div><InfoRows rows={Object.entries(row).filter(([key]) => !['id','label'].includes(key)).map(([key, value]) => [labelize(key), value === true ? 'Yes' : value === false ? 'No' : value ?? '-'] as [string, any])} /></div>)}</div>;
}

export function Panel({ title, data, empty }: { title: string; data?: any; empty: string }) {
  return <TabPanel title={title}><SectionRows data={data} empty={empty} /></TabPanel>;
}

export function HeaderFacts({ rows }: { rows: Array<[string, any]> }) {
  return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{rows.map(([label, value]) => <ReadOnlyFact key={label} label={label} value={value} />)}</div>;
}

export function StatusBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'Unknown'} />;
}

export function ReviewBox({ review, onApprove, onReject }: { review: any; onApprove?: () => void; onReject?: () => void }) {
  return <div className="grid gap-3"><InfoRows rows={[['Status', review?.status], ['Requested at', formatDate(review?.requestedAt)], ['Decision', review?.decision], ['Decided at', formatDate(review?.decidedAt)], ['Reason', review?.reason]]} /><div className="flex gap-2"><button onClick={onApprove} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Approve</button><button onClick={onReject} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-black text-red-600">Reject</button></div></div>;
}

function labelize(value: string) {
  return value.replace(/_/g, ' ').replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase());
}
