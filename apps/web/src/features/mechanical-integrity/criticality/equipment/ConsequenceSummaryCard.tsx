export function ConsequenceSummaryCard({ value }: { value?: number | null | undefined }) {
  return <div className="rounded-xl border border-border bg-card p-4"><div className="text-sm text-muted-foreground">Consequence Score</div><div className="mt-2 text-2xl font-semibold">{value ?? 'Pending'}</div></div>;
}
