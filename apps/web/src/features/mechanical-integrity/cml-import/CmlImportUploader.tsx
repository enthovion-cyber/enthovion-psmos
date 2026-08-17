'use client';

export function CmlImportUploader({ value, onChange, readingImport }: { value: string; onChange: (value: string) => void; readingImport?: boolean }) {
  return <textarea className="min-h-72 w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-sm text-[var(--psm-text)] shadow-sm" value={value} onChange={(event) => onChange(event.target.value)} placeholder={readingImport ? 'cml_number,reading_date,thickness_value,thickness_unit,inspector_name,instrument_used,notes' : 'cml_number,cml_type,description,equipment_section,piping_circuit,component_type,location_description,orientation,drawing_reference,isometric_reference,material,damage_mechanism,nominal_thickness,original_thickness,minimum_required_thickness,alert_thickness,retirement_thickness,thickness_unit,inspection_method'} />;
}
