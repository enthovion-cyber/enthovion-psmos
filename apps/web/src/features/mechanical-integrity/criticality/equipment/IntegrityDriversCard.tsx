export function IntegrityDriversCard({ snapshot }: { snapshot?: Record<string, any> }) {
  const drivers = Object.entries(snapshot?.integrityDrivers ?? {}).filter(([, value]) => value === true || typeof value === 'number');
  return <div className="rounded-xl border border-border bg-card p-4"><h2 className="font-semibold">Integrity Drivers</h2><div className="mt-3 flex flex-wrap gap-2">{drivers.length ? drivers.map(([key, value]) => <span key={key} className="rounded-full border border-border px-3 py-1 text-xs">{key}: {String(value)}</span>) : <span className="text-sm text-muted-foreground">No backend drivers available.</span>}</div></div>;
}
