import { TrainingCard } from '../../shared/TrainingUi';

export function WorkerIdentitySection({ value, onChange }: { value: Record<string, any>; onChange: (next: Record<string, any>) => void }) {
  const patch = (key: string, next: any) => onChange({ [key]: next });
  return (
    <TrainingCard title="1. Worker Identity" subtitle="Display name and at least one unique identifier are required. Passwords and auth users are not created here.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="First name" value={value.firstName} onChange={(v) => patch('firstName', v)} />
        <Field label="Last name" value={value.lastName} onChange={(v) => patch('lastName', v)} />
        <Field label="Display name *" value={value.displayName} onChange={(v) => patch('displayName', v)} />
        <Field label="Work email" value={value.workEmail} onChange={(v) => patch('workEmail', v)} />
        <Field label="Personal email (optional)" value={value.personalEmail} onChange={(v) => patch('personalEmail', v)} />
        <Field label="Phone (optional)" value={value.phone} onChange={(v) => patch('phone', v)} />
        <Field label="Employee ID" value={value.employeeId} onChange={(v) => patch('employeeId', v)} />
        <Field label="Contractor ID" value={value.contractorId} onChange={(v) => patch('contractorId', v)} />
        <Field label="Badge number" value={value.badgeNumber} onChange={(v) => patch('badgeNumber', v)} />
        <Field label="Preferred language" value={value.preferredLanguage} onChange={(v) => patch('preferredLanguage', v)} />
        <Field label="Timezone" value={value.timezone} onChange={(v) => patch('timezone', v)} />
        <Field label="Notes" value={value.notes} onChange={(v) => patch('notes', v)} />
      </div>
    </TrainingCard>
  );
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1 block font-semibold">{label}</span><input className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}
