import { PsiCard } from '../../shared/PsiUi';

export function DeviationConsequencesSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  const row = value.consequences?.[0] ?? {};
  const patch = (input: Record<string, unknown>) => onChange({ consequences: [{ ...row, ...input }] });
  return (
    <PsiCard title="4. Consequences of Deviation" subtitle="Structured high/low deviation consequences, severity, detectability, HAZOP links, and unwanted reaction scenario references.">
      <div className="grid gap-3 md:grid-cols-3">
        <select value={row.deviation_direction ?? 'High'} onChange={(e) => patch({ deviation_direction: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">{['High','Low','High-high','Low-low','No flow','Reverse flow','Wrong composition','Wrong ratio','Fast addition','Slow addition','Other'].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={row.severity ?? 'Moderate'} onChange={(e) => patch({ severity: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">{['Minor','Moderate','Major','Severe','Catastrophic'].map((item) => <option key={item}>{item}</option>)}</select>
        <input value={row.time_to_consequence ?? ''} onChange={(e) => patch({ time_to_consequence: e.target.value })} placeholder="Time to consequence" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        {['deviation_description','process_consequence','safety_consequence','environmental_consequence','quality_consequence','equipment_integrity_consequence','overpressure_consequence','reaction_hazard_consequence','toxic_release_consequence','fire_explosion_consequence','detectability','related_unwanted_reaction_scenario_id','related_hazop_deviation_id','notes'].map((key) => <input key={key} value={row[key] ?? ''} onChange={(e) => patch({ [key]: e.target.value })} placeholder={key.replaceAll('_', ' ')} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />)}
      </div>
    </PsiCard>
  );
}
