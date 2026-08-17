import type { EquipmentFormState } from './EquipmentForm';
import { Section } from './EquipmentBasicInfoSection';
import { Field, TextInput } from './form-controls';

export function EquipmentScheduleDefaultsSection({ values, onChange }: { values: EquipmentFormState; onChange: (patch: Partial<EquipmentFormState>) => void }) {
  return (
    <Section title="Inspection / PM Defaults">
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={!!values.inspectionRequired} onChange={(event) => onChange({ inspectionRequired: event.target.checked })} /> Inspection required</label>
      <Field label="Next inspection due"><TextInput type="date" value={values.nextInspectionDueDate} onChange={(nextInspectionDueDate) => onChange({ nextInspectionDueDate })} /></Field>
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={!!values.pmRequired} onChange={(event) => onChange({ pmRequired: event.target.checked })} /> PM required</label>
      <Field label="Next PM due"><TextInput type="date" value={values.nextPmDueDate} onChange={(nextPmDueDate) => onChange({ nextPmDueDate })} /></Field>
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={!!values.calibrationRequired} onChange={(event) => onChange({ calibrationRequired: event.target.checked })} /> Calibration required</label>
      <Field label="Next calibration due"><TextInput type="date" value={values.nextCalibrationDueDate} onChange={(nextCalibrationDueDate) => onChange({ nextCalibrationDueDate })} /></Field>
    </Section>
  );
}
