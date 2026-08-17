import { PsiButton, PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import { FieldGrid, SelectInput, TextArea, TextInput } from '../SafeguardPrimitives';

const sourceModules = ['PSI Process Chemistry unwanted scenario', 'PSI Safe Operating Limit deviation', 'PSI Chemical hazard', 'PSI Relief scenario', 'PSI Material Compatibility conflict', 'PSI Electrical Classification ignition source control', 'HAZOP', 'LOPA/SIL', 'Incident scenario', 'MOC risk item', 'PSSR startup requirement', 'PTW hazard', 'Audit finding', 'Manual hazard scenario'];
const hazardTypes = ['Overpressure', 'High temperature', 'Low temperature', 'Loss of containment', 'Toxic release', 'Flammable release', 'Fire', 'Explosion', 'Runaway reaction', 'Decomposition', 'Polymerization', 'Wrong chemical addition', 'Loss of cooling', 'Loss of agitation', 'Loss of inerting', 'Corrosion/material failure', 'Electrical ignition', 'Mechanical failure', 'Human error', 'Environmental release', 'Other'];

export function SafeguardHazardScenarioSection({ existing, draft, onDraftChange, onAdd, busy }: { existing: Array<Record<string, any>>; draft: Record<string, any>; onDraftChange: (patch: Record<string, any>) => void; onAdd?: (() => void) | undefined; busy?: boolean | undefined }) {
  return <PsiCard title="2. Hazard / Scenario Controlled" subtitle="Link process chemistry, SOL, chemical hazard, relief, material/electrical conflict, HAZOP, LOPA, incident, MOC, PSSR, PTW, audit, or manual scenarios.">
    {!existing.length ? <PsiEmptyState title="No hazard/scenario links yet" message="Critical safeguards require at least one explicit hazard or scenario relationship." /> : <div className="mb-4 grid gap-3 md:grid-cols-2">{existing.map((item) => <article key={item.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{item.scenario_title}</p><p className="text-sm text-[var(--psm-muted)]">{item.source_module} / {item.hazard_type}</p><p className="text-sm">{item.safeguard_role ?? item.required_performance ?? 'Role/performance not recorded'}</p></article>)}</div>}
    <FieldGrid>
      <SelectInput label="Source module" value={draft.source_module} options={sourceModules} onChange={(source_module) => onDraftChange({ source_module })} />
      <TextInput label="Source record" value={draft.source_record_id} onChange={(source_record_id) => onDraftChange({ source_record_id })} />
      <TextInput label="Source record label" value={draft.source_record_label} onChange={(source_record_label) => onDraftChange({ source_record_label })} />
      <TextInput label="Scenario title" value={draft.scenario_title} onChange={(scenario_title) => onDraftChange({ scenario_title })} />
      <SelectInput label="Hazard type" value={draft.hazard_type} options={hazardTypes} onChange={(hazard_type) => onDraftChange({ hazard_type })} />
      <TextInput label="Cause controlled" value={draft.cause_controlled} onChange={(cause_controlled) => onDraftChange({ cause_controlled })} />
      <TextInput label="Consequence reduced" value={draft.consequence_reduced} onChange={(consequence_reduced) => onDraftChange({ consequence_reduced })} />
      <TextInput label="Deviation direction" value={draft.deviation_direction} onChange={(deviation_direction) => onDraftChange({ deviation_direction })} />
      <SelectInput label="Severity" value={draft.severity} options={['Low', 'Medium', 'High', 'Critical', 'Catastrophic']} onChange={(severity) => onDraftChange({ severity })} />
      <TextInput label="Safeguard role" value={draft.safeguard_role} onChange={(safeguard_role) => onDraftChange({ safeguard_role })} />
      <TextInput label="Required performance" value={draft.required_performance} onChange={(required_performance) => onDraftChange({ required_performance })} />
      <TextInput label="Link confidence" value={draft.link_confidence} onChange={(link_confidence) => onDraftChange({ link_confidence })} />
      <TextArea label="Related consequence / notes" value={draft.notes} onChange={(notes) => onDraftChange({ notes })} />
    </FieldGrid>
    {onAdd ? <div className="mt-4"><PsiButton onClick={onAdd} disabled={busy || !draft.scenario_title || !draft.hazard_type} title={!draft.scenario_title || !draft.hazard_type ? 'Scenario title and hazard type are required.' : undefined}>{busy ? 'Saving...' : 'Add Hazard / Scenario Link'}</PsiButton></div> : null}
  </PsiCard>;
}
