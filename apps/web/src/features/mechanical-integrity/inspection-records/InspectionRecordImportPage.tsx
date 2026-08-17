'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { inspectionRecordService } from '../services/inspection-record.service';

export function InspectionRecordImportPage({ equipmentId }: { equipmentId?: string | undefined }) {
  const [rowsText, setRowsText] = useState('[\n  {\n    "equipment_tag": "",\n    "inspection_number": "",\n    "cml_number": "",\n    "reading_date": "",\n    "current_thickness": "",\n    "thickness_unit": "mm"\n  }\n]');
  const [message, setMessage] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async () => inspectionRecordService.importRows({ fileName: 'manual-ui-import.json', rows: JSON.parse(rowsText) }, equipmentId),
    onSuccess: (job) => setMessage(`Import uploaded. Job ${job.id ?? ''} is ${job.status ?? 'created'}. Validate and commit through the backend import workflow.`),
    onError: (error: Error) => setMessage(error.message)
  });
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Mechanical Integrity</p>
        <h1 className="text-2xl font-bold text-[var(--psm-text)]">Import Inspection / UT Readings</h1>
        <p className="text-sm text-[var(--psm-muted)]">Upload/import jobs are stored, validated, audited, and committed by backend services. File content belongs in storage; this page submits converted row metadata.</p>
      </header>
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" onClick={() => window.open('/api/v1/mechanical-integrity/inspections/import-template', '_blank')}>Download Template</button>
          <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Uploading...' : 'Upload Import Job'}</button>
        </div>
        <textarea className="mt-4 min-h-[360px] w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 font-mono text-sm text-[var(--psm-text)]" value={rowsText} onChange={(event) => setRowsText(event.target.value)} />
        {message ? <div className="mt-4 rounded-lg border border-[var(--psm-line)] p-3 text-sm text-[var(--psm-text)]">{message}</div> : null}
      </section>
    </div>
  );
}
