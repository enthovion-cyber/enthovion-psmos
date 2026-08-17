import type { MiDashboard } from '../types/mi-dashboard.types';

export function MiEquipmentHealthCharts({ charts }: { charts: MiDashboard['charts'] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <Chart title="Equipment by Status" data={charts.byStatus} />
      <Chart title="Equipment by Criticality" data={charts.byCriticality} />
      <Chart title="Inspection Due Distribution" data={charts.inspectionDue} />
      <Chart title="Fitness-for-Service" data={charts.byFitness} />
      <Chart title="Equipment by Type" data={charts.byType} />
      <Chart title="Deficiency Severity" data={charts.deficiencySeverity} />
    </section>
  );
}

function Chart({ title, data }: { title: string; data: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <div className="psm-card p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {data.length === 0 ? <p className="text-sm text-[var(--psm-muted)]">No backend data available.</p> : data.slice(0, 8).map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate">{item.label}</span><span className="font-semibold">{item.count}</span></div>
            <div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(6, (item.count / max) * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
