import Link from 'next/link';

export function HazopTeamSignoffPanel({ signoff }: { signoff: any }) {
  const rows = signoff?.rows ?? [];
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Team / Sign-Off Pending</h3><b className="text-amber-200">{signoff?.pending ?? 0}</b></div>
      <div className="space-y-2">
        {rows.slice(0, 5).map((row: any) => <Link key={row.id} href={`/hazop/${row.study_id}?tab=Review%20%26%20Sign-Off`} className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] p-3 hover:bg-[var(--psm-surface-2)]"><span><span className="block text-sm font-semibold">{row.study?.study_number ?? row.signoff_role}</span><span className="block text-xs text-[var(--psm-muted)]">{row.signoff_role ?? row.discipline}</span></span><span className="rounded-md border border-amber-400/30 bg-amber-500/15 px-2 py-1 text-xs text-amber-100">{row.status}</span></Link>)}
        {!rows.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">No pending sign-offs.</div> : null}
      </div>
    </section>
  );
}
