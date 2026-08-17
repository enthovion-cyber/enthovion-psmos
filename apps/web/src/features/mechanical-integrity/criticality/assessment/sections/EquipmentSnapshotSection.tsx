export function EquipmentSnapshotSection({ snapshot }: { snapshot?: Record<string, any> | null }) {
  const equipment = snapshot?.equipment as Record<string, unknown> | undefined;
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold">Equipment / Integrity Snapshot</h2>
      {equipment ? <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
        <div><span className="text-muted-foreground">Tag</span><div className="font-medium">{String(equipment.tag ?? '-')}</div></div>
        <div><span className="text-muted-foreground">Type</span><div className="font-medium">{String(equipment.type ?? '-')}</div></div>
        <div><span className="text-muted-foreground">Status</span><div className="font-medium">{String(equipment.status ?? '-')}</div></div>
        <div><span className="text-muted-foreground">CML Count</span><div className="font-medium">{String((snapshot?.cmlSummary as any)?.count ?? 0)}</div></div>
        <div><span className="text-muted-foreground">Lowest Remaining Life</span><div className="font-medium">{String((snapshot?.cmlSummary as any)?.lowestRemainingLife ?? 'Not calculated')}</div></div>
        <div><span className="text-muted-foreground">Highest Corrosion Rate</span><div className="font-medium">{String((snapshot?.cmlSummary as any)?.highestCorrosionRate ?? 'Not calculated')}</div></div>
      </div> : <div className="mt-3 text-sm text-muted-foreground">Snapshot loads after equipment is selected.</div>}
    </section>
  );
}
