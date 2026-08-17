'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspectionRecordMutations } from '../hooks/useInspectionRecordMutations';
import { validateInspectionRecordDraft } from '../schemas/inspection-record.schema';
import { InspectionContextSection } from './sections/InspectionContextSection';
import { InspectionExecutionDetailsSection } from './sections/InspectionExecutionDetailsSection';
import { InspectionPlanScheduleSection } from './sections/InspectionPlanScheduleSection';

export function InspectionRecordFormPage({ equipmentId }: { equipmentId?: string }) {
  const router = useRouter();
  const mutations = useInspectionRecordMutations(undefined, equipmentId);
  const [form, setForm] = useState<Record<string, any>>({ equipmentId: equipmentId ?? '', inspectionType: 'UT Thickness', inspectionMethod: 'UT Thickness', inspectionDate: new Date().toISOString().slice(0, 10), planned: true });
  const missing = validateInspectionRecordDraft(form);
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Inspection execution</p><h1 className="mt-1 text-2xl font-bold text-[var(--psm-text)]">Create Inspection Record</h1><p className="mt-1 text-sm text-[var(--psm-muted)]">Create a real inspection execution record. Checklist, CML readings and remaining-life results are stored through backend APIs.</p></header>
      <InspectionContextSection value={form} onChange={setForm} equipmentId={equipmentId} />
      <InspectionPlanScheduleSection value={form} onChange={setForm} />
      <InspectionExecutionDetailsSection value={form} onChange={setForm} />
      {missing.length ? <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">Missing required fields: {missing.join(', ')}</div> : null}
      {mutations.create.error ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{mutations.create.error.message}</div> : null}
      <div className="flex justify-end gap-2"><button className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold" onClick={() => router.back()}>Cancel</button><button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={mutations.create.isPending || missing.length > 0} title={missing.length ? `Missing ${missing.join(', ')}` : undefined} onClick={() => mutations.create.mutate(form, { onSuccess: (detail) => router.push(`/mechanical-integrity/inspections/${detail.record.id}`) })}>{mutations.create.isPending ? 'Creating...' : 'Create Inspection'}</button></div>
    </div>
  );
}
