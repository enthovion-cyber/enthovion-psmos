import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function HazopTrendCharts({ charts }: { charts: Record<string, any> }) {
  const trends = [
    ['Studies Created', charts.studiesCreatedTrend, '#22c55e'],
    ['Studies Closed', charts.studiesClosedTrend, '#38bdf8'],
    ['Open Recommendations', charts.openRecommendationsTrend, '#f97316'],
    ['High / Critical Risks', charts.highRiskTrend, '#ef4444'],
    ['Overdue Actions', charts.overdueActionsTrend, '#f59e0b'],
    ['Revalidation Due', charts.revalidationDueTrend, '#60a5fa']
  ] as const;
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h3 className="mb-3 font-semibold">Trends</h3>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {trends.map(([title, data, color]) => <MiniTrend key={title} title={title} data={data ?? []} color={color} />)}
      </div>
    </section>
  );
}

function MiniTrend({ title, data, color }: { title: string; data: any[]; color: string }) {
  const total = data.reduce((sum, row) => sum + Number(row.count ?? 0), 0);
  return (
    <div className="rounded-lg border border-[var(--psm-line)] p-3">
      <div className="flex items-center justify-between"><span className="text-xs text-[var(--psm-muted)]">{title}</span><b>{total}</b></div>
      <div className="mt-2 h-24">
        {data.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#1f3345" /><XAxis dataKey="month" hide /><YAxis hide /><Tooltip /><Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-xs text-[var(--psm-muted)]">No trend</div>}
      </div>
    </div>
  );
}
