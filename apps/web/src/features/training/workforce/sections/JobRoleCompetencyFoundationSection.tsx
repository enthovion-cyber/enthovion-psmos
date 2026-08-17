import { TrainingCard } from '../../shared/TrainingUi';

export function JobRoleCompetencyFoundationSection({ value, onChange }: { value: Record<string, any>; onChange: (next: Record<string, any>) => void }) {
  const patch = (key: string, next: any) => onChange({ [key]: next });
  const role = value.roleAssignment ?? {};
  return (
    <TrainingCard title="4. Job Role / Competency Foundation" subtitle="This phase stores role and PTW candidate foundation only; Training Matrix and PTW authorization enforcement come later.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Job role" value={value.jobRole ?? role.jobRole} onChange={(v) => patch('jobRole', v)} />
        <Field label="Competency profile placeholder" value={role.competencyProfileId} onChange={(v) => patch('roleAssignment', { ...role, competencyProfileId: v })} />
        <Toggle label="Safety-critical role" checked={Boolean(value.safetyCriticalRole ?? role.safetyCritical)} onChange={(v) => patch('safetyCriticalRole', v)} />
        <Toggle label="PTW role candidate" checked={Boolean(role.ptwRoleCandidate)} onChange={(v) => patch('roleAssignment', { ...role, ptwRoleCandidate: v })} />
        {['operationsRole', 'maintenanceRole', 'hseRole', 'engineeringRole', 'contractorRole'].map((key) => <Toggle key={key} label={label(key)} checked={Boolean(role[key])} onChange={(v) => patch('roleAssignment', { ...role, [key]: v })} />)}
        <Field label="Role effective date" type="date" value={role.effectiveDate} onChange={(v) => patch('roleAssignment', { ...role, effectiveDate: v })} />
        <Field label="Role expiry date" type="date" value={role.expiryDate} onChange={(v) => patch('roleAssignment', { ...role, expiryDate: v })} />
        <Field label="Role notes" value={role.notes} onChange={(v) => patch('roleAssignment', { ...role, notes: v })} />
      </div>
    </TrainingCard>
  );
}

function label(key: string) { return key.replace(/([A-Z])/g, ' $1').replace(/^./, (m) => m.toUpperCase()); }
function Field({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (value: string) => void; type?: string }) {
  return <label className="text-sm"><span className="mb-1 block font-semibold">{label}</span><input type={type} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}
