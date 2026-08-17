'use client';

import { useMutation } from '@tanstack/react-query';
import { miExportService } from '../services/mi-export.service';

export function EquipmentIntegrityFileExport({ equipmentId }: { equipmentId: string }) {
  const mutation = useMutation({ mutationFn: (input: Record<string, unknown>) => miExportService.equipmentIntegrityFile(equipmentId, input) });

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <h1 className="text-xl font-semibold">Equipment Integrity File Export</h1>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">
        Creates an equipment package with lifecycle history, inspections, CML, PM/calibration, PSV/SIF/safeguard events, deficiencies, work orders, readiness, approvals, documents, and audit metadata based on backend permissions.
      </p>
      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ outputFormat: 'zip', includeDocuments: true, includeHistory: true, includeAudit: true, includeLinkedRecords: true })}
        className="mt-4 rounded-lg bg-[var(--psm-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {mutation.isPending ? 'Creating package...' : 'Create Integrity File'}
      </button>
      {mutation.error ? <p className="mt-3 text-sm text-red-600">Unable to create integrity file. Check export permissions and equipment access.</p> : null}
      {mutation.data ? <p className="mt-3 text-sm text-emerald-600">Package created: {mutation.data.package.package_number}</p> : null}
    </section>
  );
}
