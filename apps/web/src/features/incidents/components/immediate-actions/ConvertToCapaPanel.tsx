import { TabPanel } from '../shared/IncidentTabPrimitives';

export function ConvertToCapaPanel({ data }: any) {
  const rows = data?.required ?? [];
  return <TabPanel title="Convert to CAPA / Formal Action">
    <div className="grid gap-3">
      {!rows.length ? <p className="text-xs text-slate-500">No immediate actions currently require CAPA conversion.</p> : rows.map((row: any) => <div key={row.id} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
        <div className="font-bold">{row.title ?? row.action_label}</div>
        <div className="mt-1 text-slate-500">{row.capa_conversion_status ?? (row.capa_action_id || row.linked_capa_action_id ? 'Linked' : 'Not linked')}</div>
        <div className="mt-1 text-slate-500">Linked CAPA/action: <b>{row.linked_capa_action_id ?? row.capa_action_id ?? '-'}</b></div>
        <div className="mt-1 text-slate-500">Reason: <b>{row.restart_blocker ? 'Restart blocker' : row.temporary_control || row.temporary_control_added ? 'Temporary control' : row.replacement_permanent_action_required ? 'Permanent action required' : 'Marked CAPA required'}</b></div>
      </div>)}
      {data?.status?.length ? <div className="grid gap-1">{data.status.map((item: any) => <div key={item.label} className="flex justify-between rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-cyan-300/10"><span>{item.label}</span><b>{item.count}</b></div>)}</div> : null}
    </div>
  </TabPanel>;
}
