import { validateImpairmentInput } from '../../schemas/impairment.schema';
import { ActionButton, PrimaryButton, SectionCard } from '../../safeguards/SafeguardUiPrimitives';

export function ReviewSubmitSection({ value, saving, onSave }: { value: Record<string, any>; saving?: boolean; onSave: () => void }) {
  const missing = validateImpairmentInput(value);
  return (
    <SectionCard title="7. Review & Submit" description="Review missing data, blockers, warnings, and workflow impacts before saving.">
      {missing.length ? (
        <div className="mb-4 space-y-2">
          {missing.map((item) => <div key={item} className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">{item}</div>)}
        </div>
      ) : <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">Required create fields are complete. Backend will run final validation before save.</div>}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs text-[var(--psm-muted)]">Safeguard</p><p className="font-semibold">{value.safeguardTag || value.safeguardId || 'Not selected'}</p></div>
        <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs text-[var(--psm-muted)]">Risk / status</p><p className="font-semibold">{value.riskLevel || 'Not assessed'} · {value.status || 'Draft'}</p></div>
        <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs text-[var(--psm-muted)]">Startup / MOC</p><p className="font-semibold">{value.startupBlocked ? 'Startup blocked' : 'No startup blocker'} · {value.mocRequired ? 'MOC required' : 'No MOC flag'}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PrimaryButton onClick={onSave} disabled={saving || missing.length > 0} title={missing.join(' ')}>{saving ? 'Saving...' : 'Save Record'}</PrimaryButton>
        <ActionButton disabled title="Save the record first, then submit from the detail page.">Submit for Approval</ActionButton>
      </div>
    </SectionCard>
  );
}
