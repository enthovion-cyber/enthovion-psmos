import type { EquipmentInspection } from '@/services/equipment.service';

export function InspectionOverviewCard({ inspections, onOpen }: { inspections: EquipmentInspection[]; onOpen: () => void }) {
  const last = inspections.find((item) => item.completedAt);
  const next = inspections.find((item) => !item.completedAt);
  return (
    <div className="psm-card p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Inspection Overview</h2>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-[var(--psm-muted)]">Last Inspection</span><span>{last ? new Date(last.completedAt ?? last.dueDate).toLocaleDateString() : 'None'}</span></div>
        <div className="flex justify-between"><span className="text-[var(--psm-muted)]">Next Inspection</span><span>{next ? new Date(next.dueDate).toLocaleDateString() : 'Not scheduled'}</span></div>
        <div className="flex justify-between"><span className="text-[var(--psm-muted)]">RBI Priority</span><span className="psm-badge psm-badge-warning">{next?.rbiPriority ?? last?.rbiPriority ?? 'Not set'}</span></div>
      </div>
      <button onClick={onOpen} className="psm-button psm-button-secondary mt-4 w-full">View Inspection History</button>
    </div>
  );
}
