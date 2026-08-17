import { SectionCard } from '../../safeguards/SafeguardUiPrimitives';
import { BoolField, Field, inputClass } from './SectionField';

export function DurationExpirySection({ value, onChange }: { value: Record<string, any>; onChange: (value: Record<string, any>) => void }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  return (
    <SectionCard title="4. Duration / Expiry" description="Backend calculates expiry/time remaining and escalates expired impairments.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Start date/time"><input type="datetime-local" className={inputClass} value={value.startAt ?? ''} onChange={(e) => set('startAt', e.target.value)} /></Field>
        <Field label="Max allowed duration"><input type="number" min={1} className={inputClass} value={value.maxDurationValue ?? 8} onChange={(e) => set('maxDurationValue', Number(e.target.value))} /></Field>
        <Field label="Duration unit"><select className={inputClass} value={value.maxDurationUnit ?? 'Hours'} onChange={(e) => set('maxDurationUnit', e.target.value)}><option>Hours</option><option>Days</option><option>Weeks</option></select></Field>
        <Field label="Reminder date/time"><input type="datetime-local" className={inputClass} value={value.reminderAt ?? ''} onChange={(e) => set('reminderAt', e.target.value)} /></Field>
        <Field label="Expected restoration"><input type="datetime-local" className={inputClass} value={value.expectedRestorationAt ?? ''} onChange={(e) => set('expectedRestorationAt', e.target.value)} /></Field>
        <Field label="Escalation level"><select className={inputClass} value={value.escalationLevel ?? 'Normal'} onChange={(e) => set('escalationLevel', e.target.value)}><option>Normal</option><option>Supervisor</option><option>Management</option><option>Critical Escalation</option></select></Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <BoolField label="Extension allowed" checked={!!value.extensionAllowed} onChange={(next) => set('extensionAllowed', next)} />
        <BoolField label="Extension reason required" checked={value.extensionReasonRequired !== false} onChange={(next) => set('extensionReasonRequired', next)} />
        <BoolField label="Auto-create action if expired" checked={value.autoCreateActionIfExpired !== false} onChange={(next) => set('autoCreateActionIfExpired', next)} />
      </div>
    </SectionCard>
  );
}
