'use client';

import { InspectionRecordStatusBadge } from '../../shared/InspectionRecordStatusBadge';
import type { MiInspectionRecord } from '../../types/inspection-record.types';

export function InspectionRecordDetailHeader({ record, onEdit, onBack }: { record: MiInspectionRecord; onEdit?: () => void; onBack?: () => void }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button className="mb-2 text-sm font-semibold text-primary" onClick={onBack}>Back to inspections</button>
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold text-[var(--psm-text)]">{record.inspection_number}</h1><InspectionRecordStatusBadge value={record.status} /><InspectionRecordStatusBadge value={record.review_status} /></div>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{record.equipmentTag ?? record.equipment_id} • {record.inspection_type} • {record.inspection_method ?? 'Method not set'} • {record.inspection_date ?? 'Date not set'}</p>
        </div>
        {onEdit ? <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)]" onClick={onEdit}>Edit Header</button> : null}
      </div>
    </header>
  );
}
