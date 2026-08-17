'use client';

import { Field, Input } from './WorkOrderFields';

export function WorkOrderSourceSection({ values, onChange }: { values: Record<string, any>; onChange: (key: string, value: unknown) => void }) {
  const fields: Array<[string, string]> = [
    ['equipmentId', 'Equipment ID'], ['sourceModule', 'Source module'], ['sourceRecordId', 'Source record'], ['sourceRecordNumber', 'Source record number'], ['cmlId', 'CML/TML optional'], ['safeguardId', 'Safeguard optional'], ['linkedDeficiencyId', 'Deficiency optional'], ['linkedDeviationId', 'Deviation optional'], ['sourceSummary', 'Source summary'], ['currentEquipmentStatus', 'Current equipment status'], ['currentReadinessStatus', 'Current readiness status'], ['criticality', 'Criticality']
  ];

  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{fields.map(([key, label]) => <Field key={key} label={label}><Input value={values[key]} onChange={(value) => onChange(key, value)} /></Field>)}</div>;
}
