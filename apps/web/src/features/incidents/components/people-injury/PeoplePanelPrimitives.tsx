import { ReactNode } from 'react';
import { Badge } from '../shared/IncidentStatusBadge';
import { Field, InfoRows, ReadOnlyFact, SelectField, TabPanel, TextArea, ToggleGrid, formatDate } from '../shared/IncidentTabPrimitives';

export const personTypes = ['Employee', 'Contractor', 'Visitor', 'Public', 'Emergency responder', 'Other'];
export const treatmentTypes = ['None', 'First aid', 'Medical treatment', 'Restricted work', 'Lost time', 'Hospitalization', 'Fatality', 'Not determined'];
export const exposureRoutes = ['Inhalation', 'Skin contact', 'Eye contact', 'Ingestion', 'Injection', 'Noise', 'Heat/cold', 'Radiation', 'Other', 'Not applicable'];

export function SectionRows({ data, empty }: { data?: any; empty: string }) {
  const rows = data?.rows ?? [];
  if (!rows.length) return <p className="text-xs text-slate-500">{empty}</p>;
  return <div className="grid gap-2">{rows.map((row: any) => <div key={row.id} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><div className="mb-2 font-bold">{row.personName ?? row.label}</div><InfoRows rows={Object.entries(row).filter(([key]) => !['id','personName','label'].includes(key)).map(([key, value]) => [labelize(key), formatValue(value)] as [string, any])} /></div>)}</div>;
}

export function ReviewBox({ review, onApprove, onReject }: { review: any; onApprove?: () => void; onReject?: () => void }) {
  return <div className="grid gap-3"><InfoRows rows={[['Status', review?.status], ['Requested at', formatDate(review?.requestedAt)], ['Decision', review?.decision], ['Decided at', formatDate(review?.decidedAt)], ['Reason', review?.reason]]} /><div className="flex gap-2"><button onClick={onApprove} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Approve</button><button onClick={onReject} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-black text-red-600">Reject</button></div></div>;
}

export function DrawerShell({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-slate-950/60 p-3"><div className="ml-auto flex h-full max-w-2xl flex-col overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-cyan-300/10 dark:bg-[#071525]"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-black">{title}</h2><button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-cyan-300/10">Close</button></div>{children}</div></div>;
}

export function PersonForm({ form, set }: { form: any; set: (key: string, value: any) => void }) {
  return <div className="grid gap-3 md:grid-cols-2"><Field label="Person name" value={form.personName} onChange={(v) => set('personName', v)} /><SelectField label="Person type" value={form.personType} options={personTypes} onChange={(v) => set('personType', v)} /><Field label="Job role" value={form.jobRole} onChange={(v) => set('jobRole', v)} /><Field label="Contractor/company" value={form.contractorCompany} onChange={(v) => set('contractorCompany', v)} /><Field label="Injury type" value={form.injuryType} onChange={(v) => set('injuryType', v)} /><Field label="Body part" value={form.bodyPart} onChange={(v) => set('bodyPart', v)} /><SelectField label="Treatment type" value={form.treatmentType} options={treatmentTypes} onChange={(v) => set('treatmentType', v)} /><SelectField label="Exposure route" value={form.exposureRoute} options={exposureRoutes} onChange={(v) => set('exposureRoute', v)} /><Field label="Lost time days" type="number" value={form.lostTimeDays} onChange={(v) => set('lostTimeDays', v)} /><Field label="Restricted work days" type="number" value={form.restrictedWorkDays} onChange={(v) => set('restrictedWorkDays', v)} /><div className="md:col-span-2"><ToggleGrid form={form} set={set} keys={[['injuryOccurred','Injury occurred'], ['illnessOccurred','Illness occurred'], ['exposureOccurred','Exposure occurred'], ['medicalTreatmentRequired','Medical treatment required'], ['hospitalization','Hospitalization'], ['fatality','Fatality'], ['ppeUsed','PPE used'], ['ppeIssueSuspected','PPE issue suspected'], ['chemicalExposure','Chemical exposure']]} /></div><TextArea label="Confidential medical notes" value={form.confidentialNotes} onChange={(v) => set('confidentialNotes', v)} className="md:col-span-2" /><TextArea label="Reason / notes" value={form.reason} onChange={(v) => set('reason', v)} className="md:col-span-2" /></div>;
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

function labelize(value: string) {
  return value.replace(/_/g, ' ').replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: any) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return value ?? '-';
}
