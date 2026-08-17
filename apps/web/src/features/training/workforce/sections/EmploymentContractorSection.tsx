import { TrainingCard } from '../../shared/TrainingUi';

export function EmploymentContractorSection({ value, onChange }: { value: Record<string, any>; onChange: (next: Record<string, any>) => void }) {
  const patch = (key: string, next: any) => onChange({ [key]: next });
  return (
    <TrainingCard title="2. Employment / Contractor Details" subtitle="Contractor records require contractor company and expiry warnings are visible in the profile.">
      <div className="grid gap-3 md:grid-cols-2">
        <Select label="Worker type" value={value.workerType ?? 'Employee'} items={['Employee', 'Contractor', 'Vendor', 'Visitor', 'Trainee', 'Intern', 'Auditor', 'Consultant', 'Temporary worker', 'Other']} onChange={(v) => patch('workerType', v)} />
        <Select label="Employer type" value={value.employerType ?? 'Company employee'} items={['Company employee', 'Contractor company', 'Vendor company', 'Visitor', 'External auditor', 'Other']} onChange={(v) => patch('employerType', v)} />
        <Field label="Contractor company" value={value.contractorCompanyName} onChange={(v) => patch('contractorCompanyName', v)} />
        <Field label="Vendor company" value={value.vendorCompanyName} onChange={(v) => patch('vendorCompanyName', v)} />
        <Field label="Department" value={value.departmentName} onChange={(v) => patch('departmentName', v)} />
        <Field label="Job title" value={value.jobTitle} onChange={(v) => patch('jobTitle', v)} />
        <Select label="Employment status" value={value.employmentStatus ?? 'Pending onboarding'} items={['Active', 'Pending onboarding', 'Suspended', 'Inactive', 'Archived', 'Left company', 'Contract expired']} onChange={(v) => patch('employmentStatus', v)} />
        <Field label="Start date" type="date" value={value.startDate} onChange={(v) => patch('startDate', v)} />
        <Field label="End date" type="date" value={value.endDate} onChange={(v) => patch('endDate', v)} />
        <Field label="Contract expiry date" type="date" value={value.contractExpiryDate} onChange={(v) => patch('contractExpiryDate', v)} />
        <Field label="Work schedule foundation" value={value.workScheduleFoundation} onChange={(v) => patch('workScheduleFoundation', v)} />
        <Field label="Shift/team foundation" value={value.shiftTeamFoundation} onChange={(v) => patch('shiftTeamFoundation', v)} />
      </div>
    </TrainingCard>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (value: string) => void; type?: string }) {
  return <label className="text-sm"><span className="mb-1 block font-semibold">{label}</span><input type={type} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, items, onChange }: { label: string; value: string; items: string[]; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1 block font-semibold">{label}</span><select className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>{items.map((item) => <option key={item}>{item}</option>)}</select></label>;
}
