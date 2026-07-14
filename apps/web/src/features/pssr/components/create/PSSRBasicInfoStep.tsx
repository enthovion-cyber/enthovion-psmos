'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { PSSRCreateValues } from '../../schemas/pssr-create.schema';
import { Field, inputClass, PSSRCard, textareaClass } from '../pssr-ui';

export function PSSRBasicInfoStep({ form, context }: { form: UseFormReturn<PSSRCreateValues>; context?: any }) {
  const errors = form.formState.errors;
  return (
    <PSSRCard title="Basic PSSR Information">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="PSSR Title" required error={errors.title?.message}><input className={inputClass} {...form.register('title')} /></Field>
        <Field label="PSSR Type" required error={errors.pssrType?.message}><select className={inputClass} {...form.register('pssrType')}>{(context?.pssrTypes ?? []).map((item: string) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Description"><textarea className={textareaClass} {...form.register('description')} /></Field>
        <Field label="Startup Type" required><select className={inputClass} {...form.register('startupType')}>{(context?.startupTypes ?? []).map((item: string) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Requested Startup Date"><input type="datetime-local" className={inputClass} {...form.register('requestedStartupAt')} /></Field>
        <Field label="Target Startup Date / Time" required error={errors.targetStartupAt?.message}><input type="datetime-local" className={inputClass} {...form.register('targetStartupAt')} /></Field>
        <Field label="PSSR Coordinator" required error={errors.coordinatorId?.message}><select className={inputClass} {...form.register('coordinatorId')}><option value="">Select coordinator</option>{(context?.users ?? []).map((user: any) => <option key={user.id} value={user.id}>{user.displayName} · {user.title ?? user.email}</option>)}</select></Field>
        <Field label="Department"><select className={inputClass} {...form.register('departmentId')}><option value="">Select department</option>{(context?.departments ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Company"><select className={inputClass} {...form.register('companyId')}><option value="">Auto from site</option>{(context?.companies ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Site / Plant" required error={errors.siteId?.message}><select className={inputClass} {...form.register('siteId')}><option value="">Select site</option>{(context?.sites ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Process Unit"><select className={inputClass} {...form.register('unitId')}><option value="">Select unit</option>{(context?.units ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Area"><select className={inputClass} {...form.register('areaId')}><option value="">Select area</option>{(context?.areas ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Priority"><select className={inputClass} {...form.register('priority')}>{['Low', 'Medium', 'High', 'Urgent'].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Risk Level"><select className={inputClass} {...form.register('riskLevel')}>{['Low', 'Medium', 'High', 'Critical'].map((item) => <option key={item}>{item}</option>)}</select></Field>
      </div>
    </PSSRCard>
  );
}
