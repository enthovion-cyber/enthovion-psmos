import { Field, SectionShell } from '../../relief-devices/sections/section-utils';

export function ReliefRepairAdjustmentSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="Repair / Adjustment" description="Adjustment, repair, replacement, MOC requirement, linked MOC, and notes.">
      <Field label="Adjustment required" name="adjustmentRequired" value={values.adjustmentRequired} onChange={onChange} type="checkbox" />
      <Field label="Repair required" name="repairRequired" value={values.repairRequired} onChange={onChange} type="checkbox" />
      <Field label="Repair performed" name="repairPerformed" value={values.repairPerformed} onChange={onChange} type="checkbox" />
      <Field label="Repair type" name="repairType" value={values.repairType} onChange={onChange} />
      <Field label="Spring replaced" name="springReplaced" value={values.springReplaced} onChange={onChange} type="checkbox" />
      <Field label="Seat replaced" name="seatReplaced" value={values.seatReplaced} onChange={onChange} type="checkbox" />
      <Field label="Seal replaced" name="sealReplaced" value={values.sealReplaced} onChange={onChange} type="checkbox" />
      <Field label="Replacement device ID" name="replacementDeviceId" value={values.replacementDeviceId} onChange={onChange} />
      <Field label="MOC required" name="mocRequired" value={values.mocRequired} onChange={onChange} type="checkbox" />
      <Field label="Linked MOC ID" name="linkedMocId" value={values.linkedMocId} onChange={onChange} />
      <Field label="Repair notes" name="repairNotes" value={values.repairNotes} onChange={onChange} />
    </SectionShell>
  );
}
