'use client';

import { Check, Field, Input } from './WorkOrderFields';

export function PtwLotoSafetySection({ values, onChange }: { values: Record<string, any>; onChange: (key: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{['ptwType','linkedPtwId','linkedLotoId','ppeRequirements','safetyPrecautions','riskAssessmentDocumentId','methodStatementDocumentId'].map((key) => <Field key={key} label={key.replace(/([A-Z])/g, ' $1')}><Input value={values[key]} onChange={(value) => onChange(key, value)} /></Field>)}</div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{(['ptwRequired','lotoRequired','confinedSpaceRequired','hotWorkRequired','lineBreakRequired','electricalIsolationRequired','workingAtHeightRequired','liftingRequired','gasTestRequired','jsaRequired','jhaRequired'] as string[]).map((key) => <Check key={key} label={key.replace(/([A-Z])/g, ' $1')} checked={values[key]} onChange={(value) => onChange(key, value)} />)}</div>
    </div>
  );
}
