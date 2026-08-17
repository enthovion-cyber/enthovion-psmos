import type { ChangeEvent } from 'react';
import { PsiCard } from '../../shared/PsiUi';

export function HazardsSummarySection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  const change = (event: ChangeEvent<HTMLTextAreaElement>) => onChange({ [event.target.name]: event.target.value });
  const fields: Array<[string, string]> = [
    ['major_process_hazards', 'Major process hazards'],
    ['major_chemical_hazards', 'Major chemical hazards'],
    ['fire_explosion_hazards', 'Fire/explosion hazards'],
    ['toxicity_hazards', 'Toxic exposure hazards'],
    ['reactivity_hazards', 'Reactivity hazards'],
    ['pressure_temperature_hazards', 'Pressure hazards / temperature hazards'],
    ['environmental_hazards', 'Environmental hazards'],
    ['critical_safeguards_summary', 'Critical safeguards summary'],
    ['emergency_response_notes', 'Emergency response notes']
  ];
  return <PsiCard title="4. Hazards Summary" subtitle="Major hazard summary drives completeness, MOC foundation, and later HAZOP/LOPA links."><div className="grid gap-3">{fields.map(([name, label]) => <label key={name} className="space-y-1 text-sm font-semibold">{label}<textarea name={name} value={value[name] ?? ''} onChange={change} rows={2} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>)}</div></PsiCard>;
}
