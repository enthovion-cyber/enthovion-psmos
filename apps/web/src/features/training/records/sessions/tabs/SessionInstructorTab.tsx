'use client';

import { TrainingCard } from '../../../shared/TrainingUi';

export function SessionInstructorTab({ session }: { session: Record<string, any> }) {
  return <TrainingCard title="Instructor / Provider"><dl className="grid gap-3 text-sm md:grid-cols-3">{Object.entries({ Instructor: session.instructorName ?? session.instructor_user_id ?? session.external_instructor_name, Provider: session.provider_name, Qualification: session.instructor_qualification, Assessor: session.assessor_user_id, Verifier: session.verifier_user_id, Notes: session.instructor_notes }).map(([k, v]) => <div key={k} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">{k}</dt><dd className="mt-1 font-semibold">{String(v ?? '-')}</dd></div>)}</dl></TrainingCard>;
}
