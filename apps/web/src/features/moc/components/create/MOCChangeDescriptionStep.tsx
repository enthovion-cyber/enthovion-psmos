'use client';

import { useFormContext } from 'react-hook-form';
import type { MOCCreateValues } from '../../schemas/moc.schema';
import { Field, StepShell, textAreaClass } from './create-ui';

const fields = [
  ['currentCondition', 'Current condition / existing design', true],
  ['proposedChange', 'Proposed change', true],
  ['reasonForChange', 'Reason for change', true],
  ['problemStatement', 'Problem statement'],
  ['businessJustification', 'Business justification'],
  ['safetyJustification', 'Safety justification'],
  ['expectedBenefit', 'Expected benefit'],
  ['preChangeState', 'Pre-change state'],
  ['postChangeState', 'Post-change state'],
  ['scopeBoundaries', 'Scope boundaries'],
  ['notIncluded', 'What is NOT included in this change'],
  ['implementationPlanSummary', 'Implementation plan summary']
] as const;

export function MOCChangeDescriptionStep() {
  const { register, formState: { errors } } = useFormContext<MOCCreateValues>();
  return (
    <StepShell eyebrow="Step 3" title="Change Description">
      <div className="grid gap-4 lg:grid-cols-2">
        {fields.map(([key, label, required]) => <Field key={key} label={label} required={required} error={(errors.changeDescription as any)?.[key]?.message}><textarea className={textAreaClass} {...register(`changeDescription.${key}`)} /></Field>)}
      </div>
    </StepShell>
  );
}
