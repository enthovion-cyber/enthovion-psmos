'use client';

import { TrainingCard } from '../../../shared/TrainingUi';
import { Field, SectionProps, Select } from './SessionIdentitySection';

export function SessionInstructorProviderSection({ form, update, context }: SectionProps) {
  return (
    <TrainingCard title="4. Instructor / Provider" subtitle="Internal instructor, external provider, qualification evidence, email, phone, approval status, and notes.">
      <div className="grid gap-3 md:grid-cols-2">
        <Select label="Internal instructor worker" value={form.instructorWorkerId ?? form.instructor_worker_id ?? ''} options={context?.workers?.map((w: any) => ({ value: w.id, label: `${w.display_name} - ${w.work_email ?? w.worker_type}` }))} onChange={(v) => update({ instructorWorkerId: v })} />
        <Select label="Internal instructor user" value={form.instructorUserId ?? form.instructor_user_id ?? ''} options={context?.users?.map((u: any) => ({ value: u.id, label: `${u.displayName ?? u.email} - ${u.email}` }))} onChange={(v) => update({ instructorUserId: v })} />
        <Field label="External instructor name" value={form.externalInstructorName ?? form.external_instructor_name} onChange={(v) => update({ externalInstructorName: v })} />
        <Field label="External provider company" value={form.externalProviderCompany ?? form.external_provider_company} onChange={(v) => update({ externalProviderCompany: v })} />
        <Select label="Instructor qualification evidence optional" value={form.instructorQualificationDocumentId ?? form.instructor_qualification_document_id ?? ''} options={context?.documents?.map((d: any) => ({ value: d.id, label: d.title ?? d.documentNo ?? d.id }))} onChange={(v) => update({ instructorQualificationDocumentId: v })} />
        <Field label="Instructor email" value={form.instructorEmail ?? form.instructor_email} onChange={(v) => update({ instructorEmail: v })} />
        <Field label="Instructor phone optional" value={form.instructorPhone ?? form.instructor_phone} onChange={(v) => update({ instructorPhone: v })} />
        <Field label="Instructor approval status foundation" value={form.instructorApprovalStatus ?? form.instructor_approval_status} onChange={(v) => update({ instructorApprovalStatus: v })} />
      </div>
    </TrainingCard>
  );
}
