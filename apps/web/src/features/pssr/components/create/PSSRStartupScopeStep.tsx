'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { PSSRCreateValues } from '../../schemas/pssr-create.schema';
import { Field, PSSRCard, textareaClass } from '../pssr-ui';

export function PSSRStartupScopeStep({ form }: { form: UseFormReturn<PSSRCreateValues> }) {
  const startupScope = form.watch('startupScope') ?? {};
  const update = (key: string, value: string) => form.setValue('startupScope', { ...startupScope, [key]: value }, { shouldDirty: true });
  return (
    <PSSRCard title="Startup Scope">
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          ['startupScopeDescription', 'Startup scope description'],
          ['whatIsBeingStarted', 'What is being started up'],
          ['whatChanged', 'What changed'],
          ['excludedSystems', 'Excluded systems'],
          ['startupSequenceSummary', 'Startup sequence summary'],
          ['startupCommunicationRequirements', 'Startup communication requirements']
        ].map(([key, label]) => <Field key={key} label={label} required={key === 'startupScopeDescription'}><textarea className={textareaClass} value={startupScope[key] ?? ''} onChange={(event) => update(key, event.target.value)} /></Field>)}
        <Field label="Startup boundaries"><textarea className={textareaClass} {...form.register('startupBoundaries')} /></Field>
        <Field label="Startup hazards"><textarea className={textareaClass} {...form.register('startupHazards')} /></Field>
        <Field label="Startup prerequisites" required error={form.formState.errors.startupPrerequisites?.message}><textarea className={textareaClass} {...form.register('startupPrerequisites')} /></Field>
        <Field label="Temporary controls during startup"><textarea className={textareaClass} {...form.register('temporaryControls')} /></Field>
      </div>
    </PSSRCard>
  );
}
