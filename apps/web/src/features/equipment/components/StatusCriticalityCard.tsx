import type { Equipment } from '@/services/equipment.service';

export function StatusCriticalityCard({ equipment }: { equipment: Equipment }) {
  const riskIndex = { LOW: 1, MEDIUM: 2, HIGH: 3, SAFETY_CRITICAL: 4 }[equipment.criticality];

  return (
    <div className="psm-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Status & Criticality</h2>
        <span className={statusBadge(equipment.status)}>{label(equipment.status)}</span>
      </div>
      <div className="space-y-4">
        <StatusRow label="Operational Status" value={<span className={statusBadge(equipment.status)}>{label(equipment.status)}</span>} />
        <StatusRow label="Criticality" value={<span className={criticalityBadge(equipment.criticality)}>{label(equipment.criticality)}</span>} />
        <StatusRow label="Safety Critical" value={<span className={equipment.safetyCritical ? 'psm-badge psm-badge-success' : 'psm-badge psm-badge-muted'}>{equipment.safetyCritical ? 'Yes' : 'No'}</span>} />
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs font-medium text-[var(--psm-muted)]">
          <span>Risk Signal</span>
          <span>{riskIndex}/4</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full ${step <= riskIndex ? riskBarColor(equipment.criticality) : 'bg-[var(--psm-surface-3)]'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label: title, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2">
      <span className="text-sm text-[var(--psm-muted)]">{title}</span>
      {value}
    </div>
  );
}

function statusBadge(status: Equipment['status']) {
  if (status === 'ACTIVE') return 'psm-badge psm-badge-success';
  if (status === 'INACTIVE') return 'psm-badge psm-badge-muted';
  if (status === 'OUT_OF_SERVICE') return 'psm-badge psm-badge-warning';
  return 'psm-badge psm-badge-danger';
}

function criticalityBadge(criticality: Equipment['criticality']) {
  if (criticality === 'LOW') return 'psm-badge psm-badge-success';
  if (criticality === 'MEDIUM') return 'psm-badge psm-badge-warning';
  return 'psm-badge psm-badge-danger';
}

function riskBarColor(criticality: Equipment['criticality']) {
  if (criticality === 'LOW') return 'bg-success';
  if (criticality === 'MEDIUM') return 'bg-warning';
  return 'bg-danger';
}

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}
