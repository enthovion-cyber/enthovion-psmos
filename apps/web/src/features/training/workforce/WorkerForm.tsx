'use client';

import { useEffect, useState } from 'react';
import type { Worker } from '../types/training.types';
import { useTrainingContext } from '../hooks/useWorkforce';
import { TrainingButton } from '../shared/TrainingUi';
import { EmploymentContractorSection } from './sections/EmploymentContractorSection';
import { JobRoleCompetencyFoundationSection } from './sections/JobRoleCompetencyFoundationSection';
import { WorkerAccountLinkSection } from './sections/WorkerAccountLinkSection';
import { WorkerAssignmentSection } from './sections/WorkerAssignmentSection';
import { WorkerDocumentsSection } from './sections/WorkerDocumentsSection';
import { WorkerIdentitySection } from './sections/WorkerIdentitySection';

export function WorkerForm({ initial, onSubmit, isSaving }: { initial?: Partial<Worker>; onSubmit: (value: Record<string, any>) => void; isSaving?: boolean }) {
  const [value, setValue] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const context = useTrainingContext();
  useEffect(() => {
    if (initial) setValue({
      displayName: initial.display_name,
      firstName: initial.first_name,
      lastName: initial.last_name,
      workEmail: initial.work_email,
      employeeId: initial.employee_id,
      contractorId: initial.contractor_id,
      badgeNumber: initial.badge_number,
      workerType: initial.worker_type,
      employerType: initial.employer_type,
      contractorCompanyName: initial.contractor_company_name,
      vendorCompanyName: initial.vendor_company_name,
      departmentName: initial.department_name,
      jobTitle: initial.job_title,
      employmentStatus: initial.employment_status,
      primarySiteId: initial.primary_site_id,
      linkedUserId: initial.linked_user_id,
      safetyCriticalRole: initial.safety_critical_role,
      notes: initial.notes
    });
  }, [initial?.id]);
  const patch = (next: Record<string, any>) => setValue((current) => ({ ...current, ...next }));
  const cleanPayload = (input: Record<string, any>): Record<string, any> => Object.fromEntries(
    Object.entries(input)
      .map(([key, current]) => {
        if (typeof current === 'string') {
          const trimmed = current.trim();
          return [key, trimmed || undefined];
        }
        if (current && typeof current === 'object' && !Array.isArray(current)) {
          const nested = cleanPayload(current);
          return [key, Object.keys(nested).length ? nested : undefined];
        }
        return [key, current];
      })
      .filter(([, current]) => current !== undefined && current !== null)
  );
  const submit = () => {
    const missing = [];
    if (!value.displayName) missing.push('Display name');
    if (value.workerType === 'Contractor' && !value.contractorCompanyName) missing.push('Contractor company');
    setErrors(missing);
    if (!missing.length) onSubmit(cleanPayload(value));
  };
  return (
    <div className="space-y-5">
      {errors.length ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">Missing required fields: {errors.join(', ')}</div> : null}
      <WorkerIdentitySection value={value} onChange={patch} />
      <EmploymentContractorSection value={value} onChange={patch} />
      <WorkerAssignmentSection value={value} onChange={patch} context={context.data ?? {}} />
      <JobRoleCompetencyFoundationSection value={value} onChange={patch} />
      <WorkerAccountLinkSection value={value} onChange={patch} context={context.data ?? {}} />
      <WorkerDocumentsSection value={value} onChange={patch} context={context.data ?? {}} />
      <div className="flex flex-wrap justify-end gap-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
        <TrainingButton href="/training-competency/workforce" variant="secondary">Cancel</TrainingButton>
        <TrainingButton onClick={submit} disabled={Boolean(isSaving)} title={isSaving ? 'Saving worker profile' : ''}>{isSaving ? 'Saving...' : 'Review & Save Worker'}</TrainingButton>
      </div>
    </div>
  );
}
