'use client';

import type { IplRegistryRecord } from '../../types/lopa-ipl-registry.types';
import { DetailRow } from '../libraries/LibraryShared';
import { IplRegistryRiskBadge } from './IplRegistryStatusBadge';

export function IplRegistryPfdRrfPanel({ record }: { record: IplRegistryRecord }) {
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
      <h3 className="text-sm font-black text-white">PFDavg / RRF Basis</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-cyan-300/10 bg-[#071525] p-3"><div className="text-xs text-slate-500">PFDavg</div><div className="mt-1"><IplRegistryRiskBadge value={record.pfdavg ?? null} /></div></div>
        <div className="rounded-lg border border-cyan-300/10 bg-[#071525] p-3"><div className="text-xs text-slate-500">RRF</div><div className="mt-1"><IplRegistryRiskBadge value={record.rrf ?? null} /></div></div>
      </div>
      <div className="mt-3">
        <DetailRow label="PFD Basis" value={record.pfd_basis} />
        <DetailRow label="RRF Basis" value={record.rrf_basis} />
        <DetailRow label="Source" value={record.source_type} />
        <DetailRow label="Reference" value={record.source_reference} />
        <DetailRow label="Standard" value={record.standard_reference} />
      </div>
    </section>
  );
}
