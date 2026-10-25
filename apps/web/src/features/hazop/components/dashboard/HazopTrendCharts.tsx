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
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 sm:p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--psm-text)]">Process Safety Trends</h3>
        <span className="text-[11px] text-[var(--psm-muted)]">Rolling 12-month performance</span>
      </div>
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {trends.map(([title, data, color]) => <MiniTrend key={title} title={title} data={data ?? []} color={color} />)}
      </div>
    </section>
  );
}

function MiniTrend({ title, data, color }: { title: string; data: any[]; color: string }) {
  const total = data.reduce((sum, row) => sum + Number(row.count ?? 0), 0);
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/30 p-2.5 transition hover:bg-[var(--psm-surface-2)]/60">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-medium text-[var(--psm-muted)] truncate">{title}</span>
        <b className="text-xs font-bold text-[var(--psm-text)]">{total}</b>
      </div>
      <div className="mt-2 h-16">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--psm-line)" opacity={0.3} />
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0 && payload[0]) {
                    return (
                      <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2 py-1 shadow-md text-[10px]">
                        <span className="font-semibold text-[var(--psm-text)]">{payload[0].value ?? 0}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-[var(--psm-muted)]">No trend</div>
        )}
      </div>
    </div>
  );
}
