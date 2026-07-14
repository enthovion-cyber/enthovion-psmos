'use client';

import { useFormContext } from 'react-hook-form';
import { changeCategories, changeTypes, priorities, type MOCCreateValues } from '../../schemas/moc.schema';
import type { MocContext } from '../../services/moc.service';
import { Field, inputClass, StepShell, textAreaClass } from './create-ui';

export function MOCBasicInfoStep({ context }: { context?: MocContext }) {
  const { register, formState: { errors } } = useFormContext<MOCCreateValues>();
  return (
    <StepShell eyebrow="Step 1" title="Basic Change Information">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="MOC title" required error={errors.title?.message}><input className={inputClass} {...register('title')} /></Field>
        <Field label="Priority"><select className={inputClass} {...register('priority')}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="MOC description" required error={errors.description?.message}><textarea className={textAreaClass} {...register('description')} /></Field>
        <div className="grid gap-4">
          <Field label="Change type" required><select className={inputClass} {...register('changeType')}>{changeTypes.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Change category"><select className={inputClass} {...register('changeCategory')}>{changeCategories.map((item) => <option key={item}>{item}</option>)}</select></Field>
        </div>
        <Field label="Requested start date"><input type="date" className={inputClass} {...register('requestedStartDate')} /></Field>
        <Field label="Target implementation date" required error={errors.targetImplementationDate?.message}><input type="date" className={inputClass} {...register('targetImplementationDate')} /></Field>
        <Field label="Originator"><select className={inputClass} {...register('originatorId')}><option value="">Current user</option>{context?.users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></Field>
        <Field label="Department" required error={errors.departmentId?.message}><select className={inputClass} {...register('departmentId')}><option value="">Select department</option>{context?.departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}</select></Field>
        <Field label="Company"><select className={inputClass} {...register('companyId')}><option value="">Auto from site</option>{context?.companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field>
        <Field label="Site / Plant" required error={errors.siteId?.message}><select className={inputClass} {...register('siteId')}><option value="">Select site</option>{context?.sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></Field>
      </div>
    </StepShell>
  );
}
