export function AsFoundReadingsSection({ points }: { points?: Array<Record<string, unknown>> }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><h2 className="font-semibold">As-Found Readings</h2><div className="mt-3 space-y-2">{(points ?? []).map((point, index) => <div key={String(point.id ?? index)} className="rounded border border-[var(--psm-line)] p-3 text-sm">Point {String(point.point_number ?? index + 1)}: output {String(point.as_found_output ?? '-')} / result {String(point.as_found_pass_fail ?? 'Not Entered')}</div>)}</div></section>;
}

