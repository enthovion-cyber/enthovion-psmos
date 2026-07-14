import Link from 'next/link';

export function HazopLopaRequiredPanel({ studies }: { studies: any[] }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">LOPA Required</h3><span className="text-xs text-blue-300">View all</span></div>
      <div className="space-y-2">
        {studies.slice(0, 6).map((study) => <Link key={study.id} href={`/hazop/${study.id}?tab=Risk%20Ranking`} className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] p-3 hover:bg-[var(--psm-surface-2)]"><span><span className="block text-sm font-semibold">{study.study_number}</span><span className="block text-xs text-[var(--psm-muted)]">{study.title}</span></span><b className="text-purple-200">{study.lopaRequiredCount ?? 0}</b></Link>)}
        {!studies.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">No pending LOPA required studies.</div> : null}
      </div>
    </section>
  );
}
