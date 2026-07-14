import { Badge } from '../shared/IncidentStatusBadge';
import { TabPanel } from '../shared/IncidentTabPrimitives';
export function ReportTemplateSelectionPanel({ data, onSelect }: any) {
  const templates = data?.templates ?? [];
  return <TabPanel title="Report Template Selection Panel"><div className="grid gap-2">{templates.length ? templates.map((row: any) => <button key={row.id} onClick={() => onSelect(row)} className="rounded-lg border border-slate-200 p-3 text-left text-xs hover:border-blue-400 dark:border-cyan-300/10"><div className="flex justify-between gap-2"><b>{row.template_name}</b><Badge value={row.template_type} /></div><div className="text-slate-500">Version {row.template_version} · Formats {(row.supported_formats_json ?? []).join(', ') || '-'}</div><div className="text-slate-500">Redaction profiles {(row.redaction_profiles_json ?? []).join(', ') || 'Configured by backend'}</div></button>) : <p className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-200">Template missing. Configure a company/site report template or Document Control template.</p>}</div></TabPanel>;
}
