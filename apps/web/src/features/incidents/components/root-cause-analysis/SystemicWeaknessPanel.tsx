import { RcaEmpty, RcaPanel } from './RcaPrimitives';

export function SystemicWeaknessPanel({ rows, onCreate }: any) {
  return <RcaPanel title="Systemic / Management System Weakness Panel"><button className="mb-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white" onClick={onCreate}>Add Systemic Weakness</button>{!rows?.length ? <RcaEmpty text="No systemic management-system weaknesses recorded." /> : <div className="grid gap-2">{rows.map((row: any) => <div key={row.id} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><div className="flex justify-between"><b>{row.management_system_element}</b><span>{row.capa_required ? 'CAPA required' : 'CAPA not required'}</span></div><p className="text-slate-500">{row.weakness_description}</p><p className="text-slate-500">Existing control: {row.existing_control ?? '-'} · Gap: {row.gap_description ?? '-'}</p></div>)}</div>}</RcaPanel>;
}
