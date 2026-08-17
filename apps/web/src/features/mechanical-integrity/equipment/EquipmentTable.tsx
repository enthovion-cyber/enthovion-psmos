import Link from 'next/link';
import type { MiEquipment } from '../types/equipment.types';
import { EquipmentStatusBadge } from '../shared/EquipmentStatusBadge';
import { EquipmentCriticalityBadge } from '../shared/EquipmentCriticalityBadge';
import { FitnessStatusBadge } from '../shared/FitnessStatusBadge';
import { InspectionStatusBadge } from '../shared/InspectionStatusBadge';
import { BypassStatusBadge } from '../shared/BypassStatusBadge';
import { DeficiencyStatusBadge } from '../shared/DeficiencyStatusBadge';

export function EquipmentTable({ rows, page, limit, total, onPage }: { rows: MiEquipment[]; page: number; limit: number; total: number; onPage: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <section className="psm-card overflow-hidden">
      <div className="overflow-auto">
        <table className="w-full min-w-[1300px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
            <tr>
              {['Equipment Tag','Equipment Name','Equipment Type','Category','Site','Unit','Area','Service','Status','Criticality','Safety-Critical','Fitness-for-Service','Inspection Status','PM Status','Calibration Status','Active Bypass','Open Deficiencies','Linked PSM Records','Last Updated','Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-[var(--psm-surface-2)]">
                <td className="px-4 py-3 font-semibold text-primary"><Link href={`/mechanical-integrity/equipment/${row.id}`}>{row.tag}</Link></td>
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">{row.type}</td>
                <td className="px-4 py-3">{row.subtype ?? row.classification ?? '-'}</td>
                <td className="px-4 py-3">{row.site?.name ?? '-'}</td>
                <td className="px-4 py-3">{row.unit?.name ?? '-'}</td>
                <td className="px-4 py-3">{row.area?.name ?? '-'}</td>
                <td className="px-4 py-3">{row.fluidName ?? row.fluidService ?? '-'}</td>
                <td className="px-4 py-3"><EquipmentStatusBadge value={row.status} /></td>
                <td className="px-4 py-3"><EquipmentCriticalityBadge value={row.criticality} /></td>
                <td className="px-4 py-3">{row.safetyCritical ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3"><FitnessStatusBadge value={row.fitnessStatus} /></td>
                <td className="px-4 py-3"><InspectionStatusBadge value={row.inspectionStatus} /></td>
                <td className="px-4 py-3">{row.pmStatus ?? 'Not configured'}</td>
                <td className="px-4 py-3">{row.calibrationStatus ?? 'Not configured'}</td>
                <td className="px-4 py-3"><BypassStatusBadge active={row.bypassActive} /></td>
                <td className="px-4 py-3"><DeficiencyStatusBadge count={row.openDeficiencyCount} /></td>
                <td className="px-4 py-3">{row.linkedPsmRecordsCount ?? 0}</td>
                <td className="px-4 py-3">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3"><Link className="text-primary hover:underline" href={`/mechanical-integrity/equipment/${row.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--psm-line)] p-3 text-sm">
        <span className="text-[var(--psm-muted)]">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button className="psm-button psm-button-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
          <button className="psm-button psm-button-secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
}
