'use client';

import { Check, Field, Input } from './WorkOrderFields';

export function WorkPlanningSection({ values, onChange }: { values: Record<string, any>; onChange: (key: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{['plannedStartAt','plannedFinishAt','estimatedDurationMinutes','shutdownWindow','requiredOutageType','jobPlan','jobStepsJson','sequencingNotes','requiredCoordination'].map((key) => <Field key={key} label={key.replace(/([A-Z])/g, ' $1')}><Input value={values[key]} onChange={(value) => onChange(key, value)} /></Field>)}</div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{(['requiredShutdown','onlineWorkAllowed','simopsConcern','preJobBriefingRequired','toolboxTalkRequired'] as string[]).map((key) => <Check key={key} label={key.replace(/([A-Z])/g, ' $1')} checked={values[key]} onChange={(value) => onChange(key, value)} />)}</div>
    </div>
  );
}
