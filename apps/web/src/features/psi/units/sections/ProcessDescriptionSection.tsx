import type { ChangeEvent } from 'react';
import { PsiCard } from '../../shared/PsiUi';

export function ProcessDescriptionSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange({ [event.target.name]: event.target.value });
  const fields: Array<[string, string]> = [
    ['process_purpose', 'Process purpose'],
    ['normal_operation_summary', 'Normal operation summary'],
    ['process_flow_summary', 'Process flow summary'],
    ['main_feed_streams_json', 'Main feed streams'],
    ['main_product_streams_json', 'Main product streams'],
    ['waste_streams_json', 'Waste/byproduct streams'],
    ['utilities_used_json', 'Utilities used'],
    ['startup_shutdown_notes', 'Startup/shutdown notes']
  ];
  return (
    <PsiCard title="3. Process Description" subtitle="Structured operating and flow information for the technical plant profile.">
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map(([name, label]) => <label key={name} className="space-y-1 text-sm font-semibold md:col-span-2">{label}{name === 'process_purpose' ? ' *' : ''}<textarea name={name} value={Array.isArray(value[name]) ? value[name].join(', ') : value[name] ?? ''} onChange={change} rows={2} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>)}
        <label className="space-y-1 text-sm font-semibold">Operating mode<select name="operating_mode" value={value.operating_mode ?? ''} onChange={change} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option value="">Select</option><option>Batch</option><option>Continuous</option><option>Semi-batch</option></select></label>
      </div>
    </PsiCard>
  );
}
