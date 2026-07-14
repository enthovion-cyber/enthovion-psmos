'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { rejectSignatureSchema, type RejectSignatureValues } from '../../schemas/signature.schema';
import type { PermitSignature } from '../../services/ptw-signature.service';

export function RejectSignatureDialog({ signature, onClose, onSubmit, saving = false }: { signature: PermitSignature | null; onClose: () => void; onSubmit: (values: RejectSignatureValues) => void; saving?: boolean }) {
  const form = useForm<RejectSignatureValues>({ resolver: zodResolver(rejectSignatureSchema), defaultValues: { rejectionReason: '', correctionRequired: '', comment: '' } });
  useEffect(() => { if (signature) form.reset({ rejectionReason: '', correctionRequired: '', comment: '' }); }, [signature, form]);
  if (!signature) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-xl rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--psm-line)] p-5">
          <div><h3 className="text-lg font-semibold">Reject Signature</h3><p className="mt-1 text-sm text-[var(--psm-muted)]">{signature.signature_role ?? signature.signature_type} · rejection creates permit and signature history.</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-5">
          <label className="block text-sm font-semibold">Rejection Reason <span className="text-danger">*</span><textarea {...form.register('rejectionReason')} rows={3} className="mt-2 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 outline-none focus:border-primary" /></label>
          {form.formState.errors.rejectionReason ? <p className="text-sm text-danger">{form.formState.errors.rejectionReason.message}</p> : null}
          <label className="block text-sm font-semibold">Correction Required<textarea {...form.register('correctionRequired')} rows={2} className="mt-2 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 outline-none focus:border-primary" /></label>
          <label className="block text-sm font-semibold">Comment<textarea {...form.register('comment')} rows={2} className="mt-2 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 outline-none focus:border-primary" /></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--psm-line)] p-5"><button type="button" onClick={onClose} className="psm-button psm-button-secondary">Cancel</button><button disabled={saving} className="psm-button psm-button-danger">{saving ? 'Rejecting...' : 'Reject Signature'}</button></div>
      </form>
    </div>
  );
}
