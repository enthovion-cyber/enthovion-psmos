import Link from 'next/link';
import type { Worker } from '../types/training.types';
import { AccountLinkStatusBadge } from '../shared/AccountLinkStatusBadge';
import { CertificationStatusBadge } from '../shared/CertificationStatusBadge';
import { EmploymentStatusBadge } from '../shared/EmploymentStatusBadge';
import { PtwAuthorizationStatusBadge } from '../shared/PtwAuthorizationStatusBadge';
import { TrainingStatusBadge } from '../shared/TrainingStatusBadge';
import { WorkerTypeBadge } from '../shared/WorkerTypeBadge';
import { TrainingEmptyState } from '../shared/TrainingUi';

export function WorkforceTable({ rows = [] }: { rows?: Worker[] }) {
  if (!rows.length) return <TrainingEmptyState title="Empty workforce" message="No workers match your current filters and permission scope." />;
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-[1200px] w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>{['Worker', 'Employee / Contractor ID', 'Employer Type', 'Company', 'Site', 'Department', 'Unit / Area', 'Job Title', 'Training', 'Certification', 'PTW', 'Review', 'Status', 'Actions'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
        </thead>
        <tbody>{rows.map((worker) => <tr key={worker.id} className="border-t border-[var(--psm-line)]">
          <td className="px-3 py-3"><Link href={`/training-competency/workforce/${worker.id}`} className="font-semibold text-primary">{worker.display_name}</Link><div className="text-xs text-[var(--psm-muted)]">{worker.work_email ?? 'No work email'}</div></td>
          <td className="px-3 py-3">{worker.employee_id ?? worker.contractor_id ?? worker.badge_number ?? '-'}</td>
          <td className="px-3 py-3"><WorkerTypeBadge type={worker.worker_type} /></td>
          <td className="px-3 py-3">{worker.contractor_company_name ?? worker.vendor_company_name ?? worker.employer_type}</td>
          <td className="px-3 py-3">{worker.primarySite?.name ?? worker.primary_site_id ?? 'Missing'}</td>
          <td className="px-3 py-3">{worker.department_name ?? worker.department_id ?? '-'}</td>
          <td className="px-3 py-3">{worker.assignments?.[0]?.unit_id ?? '-'} / {worker.assignments?.[0]?.area_id ?? '-'}</td>
          <td className="px-3 py-3">{worker.job_title ?? worker.roleAssignments?.[0]?.job_role ?? 'Missing'}</td>
          <td className="px-3 py-3"><TrainingStatusBadge status={worker.training_status} /></td>
          <td className="px-3 py-3"><CertificationStatusBadge status={worker.certification_status} /></td>
          <td className="px-3 py-3"><PtwAuthorizationStatusBadge status={worker.ptw_authorization_status} /></td>
          <td className="px-3 py-3"><AccountLinkStatusBadge status={worker.review_status} /></td>
          <td className="px-3 py-3"><EmploymentStatusBadge status={worker.employment_status} /></td>
          <td className="px-3 py-3"><div className="flex gap-2"><Link className="text-primary" href={`/training-competency/workforce/${worker.id}`}>View</Link><Link className="text-primary" href={`/training-competency/workforce/${worker.id}/edit`}>Edit</Link><Link className="text-primary" href={`/training-competency/workforce/${worker.id}/history`}>History</Link></div></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
