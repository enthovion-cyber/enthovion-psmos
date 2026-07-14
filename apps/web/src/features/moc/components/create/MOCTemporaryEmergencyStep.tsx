'use client';

import { useFormContext } from 'react-hook-form';
import type { MOCCreateValues } from '../../schemas/moc.schema';
import type { MocContext } from '../../services/moc.service';
import { Field, inputClass, StepShell, textAreaClass } from './create-ui';

export function MOCTemporaryEmergencyStep({ context }: { context?: MocContext }) {
  const { register, watch } = useFormContext<MOCCreateValues>();
  const type = watch('changeType');
  return (
    <StepShell eyebrow="Step 6" title="Temporary / Emergency Controls">
      {type === 'Temporary Change' ? <div className="grid gap-4 lg:grid-cols-2">
        <Field label={`Temporary change expiry date (max ${context?.siteMaxTemporaryDurationDays ?? 90} days)`} required><input type="date" className={inputClass} {...register('temporaryControls.expiryDate')} /></Field>
        <Field label="Temporary duration days"><input type="number" className={inputClass} {...register('temporaryControls.durationDays', { valueAsNumber: true })} /></Field>
        <Field label="Reason temporary change is needed"><textarea className={textAreaClass} {...register('temporaryControls.reason')} /></Field>
        <Field label="Temporary risk controls"><textarea className={textAreaClass} {...register('temporaryControls.riskControls')} /></Field>
        <Field label="Reversal plan"><textarea className={textAreaClass} {...register('temporaryControls.reversalPlan')} /></Field>
        <Field label="Owner responsible for removal"><select className={inputClass} {...register('temporaryControls.removalOwnerId')}><option value="">Select owner</option>{context?.users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></Field>
        <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" {...register('temporaryControls.extensionAllowed')} /> Extension allowed</label>
      </div> : null}
      {type === 'Emergency Change' ? <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Emergency justification"><textarea className={textAreaClass} {...register('emergencyControls.emergencyJustification')} /></Field>
        <Field label="Immediate risk controls"><textarea className={textAreaClass} {...register('emergencyControls.immediateRiskControls')} /></Field>
        <Field label="Implemented by"><select className={inputClass} {...register('emergencyControls.implementedBy')}><option value="">Current user</option>{context?.users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></Field>
        <Field label="Implementation date/time"><input type="datetime-local" className={inputClass} {...register('emergencyControls.implementationDateTime')} /></Field>
        <Field label="Post-implementation review due date"><input type="datetime-local" className={inputClass} {...register('emergencyControls.postReviewDueDate')} /></Field>
      </div> : null}
      {type === 'Like-for-Like Replacement' ? <div className="grid gap-3 md:grid-cols-2">
        {['sameSpecification', 'sameManufacturerModel', 'sameDesignRating', 'sameMaterial', 'sameSafetyFunction'].map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200"><input type="checkbox" {...register(`likeForLike.${key}`)} /> {key.replace(/([A-Z])/g, ' $1')}</label>)}
        <Field label="Difference explanation if not identical"><textarea className={textAreaClass} {...register('likeForLike.differenceExplanation')} /></Field>
      </div> : null}
      {!['Temporary Change', 'Emergency Change', 'Like-for-Like Replacement'].includes(type) ? <p className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-5 text-sm text-slate-300">No dynamic temporary, emergency, or like-for-like controls are required for this change type.</p> : null}
    </StepShell>
  );
}
