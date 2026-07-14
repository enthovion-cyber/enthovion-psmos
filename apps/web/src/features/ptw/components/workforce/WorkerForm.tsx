import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { defaultWorkerValues, workerRoles, workerSchema, workerTypes } from '../../schemas/workforce.schema';
import type { WorkerValues } from '../../schemas/workforce.schema';
import type { PermitWorkerRecord } from '../../services/ptw-workforce.service';

export function WorkerForm({ editing, saving, onCancel, onSubmit }: { editing?: PermitWorkerRecord | null; saving?: boolean; onCancel: () => void; onSubmit: (values: WorkerValues) => void }) {
  const form = useForm<WorkerValues>({ resolver: zodResolver(workerSchema), defaultValues: defaultWorkerValues() });

  useEffect(() => {
    if (!editing) return form.reset(defaultWorkerValues());
    form.reset({
      userId: editing.user_id ?? undefined,
      workerName: editing.worker_name,
      workerType: (editing.worker_type as WorkerValues['workerType']) ?? 'Internal',
      employerCompany: editing.employer_company ?? editing.company ?? '',
      contractorCompanyId: editing.contractor_company_id ?? undefined,
      trade: editing.trade ?? '',
      badgeId: editing.badge_id ?? '',
      contactNumber: editing.contact_number ?? editing.phone ?? '',
      emergencyContactName: editing.emergency_contact_name ?? '',
      emergencyContactPhone: editing.emergency_contact_phone ?? '',
      roleOnPermit: (editing.role_on_permit ?? editing.role ?? 'Worker') as WorkerValues['roleOnPermit'],
      isPermitHolder: editing.is_permit_holder ?? false,
      isPerformingAuthority: editing.is_performing_authority ?? false,
      isAreaAuthority: editing.is_area_authority ?? false,
      isPermitIssuer: editing.is_permit_issuer ?? false,
      isFireWatch: editing.is_fire_watch ?? false,
      isAttendant: editing.is_attendant ?? false,
      isEntrySupervisor: editing.is_entry_supervisor ?? false,
      isGasTester: editing.is_gas_tester ?? false,
      isIsolationAuthority: editing.is_isolation_authority ?? false,
      briefingRequired: editing.briefing_required ?? true,
      briefingCompleted: editing.briefing_completed ?? editing.signed_briefing ?? false,
      notes: editing.notes ?? ''
    });
  }, [editing, form]);

  return (
    <section className="psm-card overflow-hidden">
      <div className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h3 className="text-lg font-semibold">{editing ? 'Edit Worker' : 'Add Worker'}</h3><p className="mt-1 text-xs text-[var(--psm-muted)]">Worker roster, role flags, briefing requirements, sign-in readiness, and emergency contact details.</p></div>
          <div className="flex gap-2"><button type="button" className="psm-button psm-button-secondary" onClick={onCancel}><X size={15} /> Cancel</button><button type="submit" form="worker-form" disabled={saving} className="psm-button psm-button-primary"><Save size={15} /> {saving ? 'Saving...' : 'Save Worker'}</button></div>
        </div>
      </div>
      <form id="worker-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-5">
        <Section title="Worker Identity">
          <Field label="Worker Name" required {...form.register('workerName')} error={form.formState.errors.workerName?.message} />
          <Select label="Worker Type" required {...form.register('workerType')} error={form.formState.errors.workerType?.message}>{workerTypes.map((item) => <option key={item}>{item}</option>)}</Select>
          <Field label="Employer Company" {...form.register('employerCompany')} error={form.formState.errors.employerCompany?.message} />
          <Field label="Contractor Company ID" {...form.register('contractorCompanyId')} />
          <Field label="Trade" required {...form.register('trade')} error={form.formState.errors.trade?.message} />
          <Field label="Badge ID" {...form.register('badgeId')} />
          <Field label="Contact Number" {...form.register('contactNumber')} error={form.formState.errors.contactNumber?.message} />
          <Select label="Role on Permit" required {...form.register('roleOnPermit')} error={form.formState.errors.roleOnPermit?.message}>{workerRoles.map((item) => <option key={item}>{item}</option>)}</Select>
        </Section>
        <Section title="Emergency Contact">
          <Field label="Emergency Contact Name" {...form.register('emergencyContactName')} error={form.formState.errors.emergencyContactName?.message} />
          <Field label="Emergency Contact Phone" {...form.register('emergencyContactPhone')} />
        </Section>
        <Section title="Permit Role Flags">
          {[
            ['isPermitHolder', 'Permit Holder'],
            ['isPerformingAuthority', 'Performing Authority'],
            ['isAreaAuthority', 'Area Authority'],
            ['isPermitIssuer', 'Permit Issuer'],
            ['isFireWatch', 'Fire Watch'],
            ['isAttendant', 'Attendant'],
            ['isEntrySupervisor', 'Entry Supervisor'],
            ['isGasTester', 'Gas Tester'],
            ['isIsolationAuthority', 'Isolation Authority'],
            ['briefingRequired', 'Briefing Required'],
            ['briefingCompleted', 'Briefing Completed']
          ].map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><input type="checkbox" {...form.register(key as keyof WorkerValues)} /> {label}</label>)}
        </Section>
        <label className="block"><span className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Notes</span><textarea className="psm-input mt-1 min-h-24 w-full" {...form.register('notes')} /></label>
      </form>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h4 className="mb-3 border-b border-[var(--psm-line)] pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{title}</h4><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div></div>;
}

function Field({ label, required, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean; error?: string | undefined }) {
  return <label className="block"><span className="text-xs font-semibold text-[var(--psm-muted)]">{label}{required ? <span className="text-danger"> *</span> : null}</span><input className="psm-input mt-1 w-full" {...props} />{error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}</label>;
}

function Select({ label, required, error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; required?: boolean; error?: string | undefined }) {
  return <label className="block"><span className="text-xs font-semibold text-[var(--psm-muted)]">{label}{required ? <span className="text-danger"> *</span> : null}</span><select className="psm-input mt-1 w-full" {...props}>{children}</select>{error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}</label>;
}
