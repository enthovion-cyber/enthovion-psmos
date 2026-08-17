'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { inspectionRecordService } from '../services/inspection-record.service';

export function OccurrenceExecutionPage({ occurrenceId }: { occurrenceId: string }) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => inspectionRecordService.createFromOccurrence(occurrenceId, {}),
    onSuccess: (detail) => router.replace(`/mechanical-integrity/inspections/${detail.record.id}`)
  });
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Scheduled occurrence</p>
        <h1 className="text-2xl font-bold text-[var(--psm-text)]">Execute Inspection Occurrence</h1>
        <p className="text-sm text-[var(--psm-muted)]">Create an audited inspection record from scheduled occurrence {occurrenceId}.</p>
      </header>
      {mutation.error ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{mutation.error.message}</div> : null}
      <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Creating inspection...' : 'Create and Open Inspection Record'}</button>
    </div>
  );
}
