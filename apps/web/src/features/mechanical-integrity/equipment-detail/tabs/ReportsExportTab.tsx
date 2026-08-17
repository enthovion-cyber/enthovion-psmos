'use client';

import { EquipmentIntegrityFileExport } from '../../export/EquipmentIntegrityFileExport';
import { GeneratedReportsTable } from '../../reports/GeneratedReportsTable';
import { useMiReports } from '../../hooks/useMiReports';

export function ReportsExportTab({ equipmentId }: { equipmentId: string }) {
  const reports = useMiReports({ equipmentId });
  return (
    <div className="space-y-4">
      <EquipmentIntegrityFileExport equipmentId={equipmentId} />
      {reports.isLoading ? <div className="rounded-xl border border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">Loading generated reports...</div> : <GeneratedReportsTable rows={reports.data?.generated} />}
    </div>
  );
}
