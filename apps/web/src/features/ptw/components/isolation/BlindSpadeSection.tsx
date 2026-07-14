import type { PermitIsolationPoint } from '../../services/ptw-isolation.service';

export function BlindSpadeSection({ points }: { points: PermitIsolationPoint[] }) {
  const blinds = points.filter((point) => point.blind_spade_number);
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wide">Blind / Spade Register</h3><span className="text-xs text-[var(--psm-muted)]">{blinds.length} blinds/spades</span></div>
      {blinds.length ? (
        <div className="overflow-auto">
          <table className="psm-table w-full min-w-[980px] text-sm">
            <thead><tr>{['Blind / Spade Number', 'Location', 'Size / Rating', 'Installed By', 'Installation Time', 'Verified By', 'Verification Time', 'Removed By', 'Removal Time', 'Status'].map((head) => <th key={head} className="px-3 py-2 text-xs uppercase text-[var(--psm-muted)]">{head}</th>)}</tr></thead>
            <tbody>{blinds.map((point) => <tr key={point.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3 font-semibold">{point.blind_spade_number}</td><td className="px-3 py-3">{point.isolation_point_tag ?? point.isolation_point}</td><td className="px-3 py-3">{point.required_position ?? '-'}</td><td className="px-3 py-3">{point.confirmed_by ?? '-'}</td><td className="px-3 py-3">{point.confirmed_at ? new Date(point.confirmed_at).toLocaleString() : '-'}</td><td className="px-3 py-3">{point.verified_by ?? '-'}</td><td className="px-3 py-3">{point.verified_at ? new Date(point.verified_at).toLocaleString() : '-'}</td><td className="px-3 py-3">{point.deisolated_by ?? '-'}</td><td className="px-3 py-3">{point.deisolated_at ? new Date(point.deisolated_at).toLocaleString() : '-'}</td><td className="px-3 py-3">{point.isolation_status ?? point.status}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-center text-sm text-[var(--psm-muted)]">No blind/spade isolations recorded.</div>}
    </section>
  );
}
