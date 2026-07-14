import { FrequencyDisplay } from './FrequencyDisplay';

export function PfdRrfDisplay({ pfd, rrf }: { pfd?: number | string | null | undefined; rrf?: number | string | null | undefined }) {
  return (
    <div className="space-y-1">
      <div><span className="text-slate-500">PFDavg </span><FrequencyDisplay value={pfd} unit="" /></div>
      <div><span className="text-slate-500">RRF </span><span className="font-mono text-sm font-bold text-slate-100">{Number(rrf || 0) ? Number(rrf).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '-'}</span></div>
    </div>
  );
}
