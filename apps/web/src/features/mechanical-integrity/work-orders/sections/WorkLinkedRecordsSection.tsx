'use client';

import { Field, Input } from './WorkOrderFields';

export function WorkLinkedRecordsSection({ values, onChange }: { values: Record<string, any>; onChange: (key: string, value: unknown) => void }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{['linkedDeficiencyId','linkedDeviationId','linkedActionId','inspectionRecordId','pmRecordId','calibrationRecordId','reliefTestId','sifProofTestId','impairmentId','mocId','pssrId','incidentId','ptwId','lotoId','documentId','equipmentId','cmlId','contractorVendor'].map((key) => <Field key={key} label={key.replace(/([A-Z])/g, ' $1')}><Input value={values[key]} onChange={(value) => onChange(key, value)} /></Field>)}</div>;
}
