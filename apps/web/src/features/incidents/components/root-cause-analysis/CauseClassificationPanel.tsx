import { RcaPanel } from './RcaPrimitives';

export function CauseClassificationPanel({ data }: { data: any }) {
  const groups = [['Human', data?.human], ['Equipment', data?.equipment], ['Process', data?.process], ['Management System', data?.managementSystem]];
  return <RcaPanel title="Human / Equipment / Process / Management-System Causes Panel"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{groups.map(([label, rows]: any) => <div key={label} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-cyan-300/10"><div className="text-lg font-black">{rows?.length ?? 0}</div><div className="font-bold">{label}</div><ul className="mt-2 grid gap-1 text-slate-500">{(rows ?? []).slice(0, 4).map((row: any) => <li key={`${label}-${row.id}`}>{row.title ?? row.root_cause_statement}</li>)}</ul></div>)}</div></RcaPanel>;
}
