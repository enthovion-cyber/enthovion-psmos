'use client';

import type { MiInspectionRecordDetail } from '../../types/inspection-record.types';

export function InspectionReportTab({ detail }: { detail: MiInspectionRecordDetail }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="font-bold text-[var(--psm-text)]">Inspection Report</h2><button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" onClick={() => window.open(`/api/v1/mechanical-integrity/inspections/${detail.record.id}/report`, '_blank')}>Download Report</button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-[var(--psm-line)] p-3"><p className="text-xs text-[var(--psm-muted)]">Checklist</p><p className="text-xl font-bold text-[var(--psm-text)]">{detail.checklist.filter((item) => item.completed_at).length}/{detail.checklist.length}</p></div>
        <div className="rounded-lg border border-[var(--psm-line)] p-3"><p className="text-xs text-[var(--psm-muted)]">Readings</p><p className="text-xl font-bold text-[var(--psm-text)]">{detail.readings.length}</p></div>
        <div className="rounded-lg border border-[var(--psm-line)] p-3"><p className="text-xs text-[var(--psm-muted)]">Findings</p><p className="text-xl font-bold text-[var(--psm-text)]">{detail.findings.length}</p></div>
        <div className="rounded-lg border border-[var(--psm-line)] p-3"><p className="text-xs text-[var(--psm-muted)]">Evidence</p><p className="text-xl font-bold text-[var(--psm-text)]">{detail.documents.length}</p></div>
      </div>
    </section>
  );
}
