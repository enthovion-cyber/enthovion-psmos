'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Settings2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { signatureRequirementSchema, type SignatureRequirementValues } from '../../schemas/signature.schema';
import type { SignatureRequirement } from '../../services/ptw-signature.service';

const purposes = ['Submit', 'Approval', 'Issue', 'Activation', 'Handover', 'Extension', 'Suspension', 'Closure', 'Override', 'Revalidation'];

export function SignatureRequirementsPanel({
  requirements,
  onCreate,
  onDelete,
  saving = false
}: {
  requirements?: SignatureRequirement[] | undefined;
  onCreate: (values: SignatureRequirementValues) => void;
  onDelete: (id: string) => void;
  saving?: boolean;
}) {
  const form = useForm<SignatureRequirementValues>({
    resolver: zodResolver(signatureRequirementSchema),
    defaultValues: { signatureRole: '', signaturePurpose: 'Approval', requiredForStatus: 'Approved', isRequired: true, expiresOnExtension: false, requiresRevalidation: false }
  });
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><Settings2 size={16} /> Signature Requirements</div>
      <form onSubmit={form.handleSubmit((values) => { onCreate(values); form.reset({ signatureRole: '', signaturePurpose: 'Approval', requiredForStatus: 'Approved', isRequired: true, expiresOnExtension: false, requiresRevalidation: false }); })} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Permit Type<input {...form.register('permitType')} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm normal-case text-[var(--psm-text)]" placeholder="Hot Work" /></label>
          <label className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Risk Level<input {...form.register('riskLevel')} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm normal-case text-[var(--psm-text)]" placeholder="High" /></label>
          <label className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Signature Role<input {...form.register('signatureRole')} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm normal-case text-[var(--psm-text)]" placeholder="HSE Reviewer" /></label>
          <label className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Purpose<select {...form.register('signaturePurpose')} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm normal-case text-[var(--psm-text)]">{purposes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Required For<input {...form.register('requiredForStatus')} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm normal-case text-[var(--psm-text)]" placeholder="Approved" /></label>
          <label className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Assigned Role ID<input {...form.register('assignedRoleId')} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm normal-case text-[var(--psm-text)]" /></label>
        </div>
        <div className="grid gap-2 text-sm md:grid-cols-3">
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('isRequired')} /> Required</label>
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('expiresOnExtension')} /> Expires on extension</label>
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('requiresRevalidation')} /> Requires revalidation</label>
        </div>
        <button disabled={saving} className="psm-button psm-button-secondary w-full"><Plus size={15} /> Add Requirement</button>
      </form>
      <div className="mt-5 space-y-2">
        {(requirements ?? []).slice(0, 8).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
          <div><div className="font-semibold">{row.signature_role}</div><div className="text-xs text-[var(--psm-muted)]">{row.permit_type ?? 'Any permit'} · {row.signature_purpose} · {row.required_for_status}</div></div>
          <button onClick={() => onDelete(row.id)} className="psm-button psm-button-danger min-h-8 px-2"><Trash2 size={14} /></button>
        </div>)}
        {!requirements?.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]">No site-specific requirement rules configured.</div> : null}
      </div>
    </section>
  );
}
