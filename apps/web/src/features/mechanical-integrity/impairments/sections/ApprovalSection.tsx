import { SectionCard } from '../../safeguards/SafeguardUiPrimitives';
import { BoolField, Field, inputClass } from './SectionField';

export function ApprovalSection({ value, onChange }: { value: Record<string, any>; onChange: (value: Record<string, any>) => void }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  return (
    <SectionCard title="5. Approvals" description="Operations, maintenance, engineering, HSE/process safety, management, functional safety, and relief-specialist approvals are represented through backend workflow/audit.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Requester user ID"><input className={inputClass} value={value.requesterUserId ?? ''} onChange={(e) => set('requesterUserId', e.target.value)} /></Field>
        <Field label="Authorized by user ID"><input className={inputClass} value={value.authorizedBy ?? ''} onChange={(e) => set('authorizedBy', e.target.value)} /></Field>
        <Field label="Final activation authorization"><input className={inputClass} value={value.activationAuthorization ?? ''} onChange={(e) => set('activationAuthorization', e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {([
          ['operationsApprovalRequired','Operations approval'], ['maintenanceApprovalRequired','Maintenance approval'], ['engineeringApprovalRequired','Engineering approval'], ['hseApprovalRequired','HSE / Process Safety approval'],
          ['managementApprovalRequired','Management approval'], ['functionalSafetyApprovalRequired','Functional safety approval'], ['reliefSpecialistApprovalRequired','Relief specialist approval'], ['restorationVerificationRequired','Restoration verification']
        ] as Array<[string, string]>).map(([key, label]) => <BoolField key={key} label={label} checked={!!value[key]} onChange={(next) => set(key, next)} />)}
      </div>
    </SectionCard>
  );
}
