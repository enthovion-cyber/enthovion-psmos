'use client';

import type { IplRegistryValidationItem } from '../../types/lopa-ipl-registry.types';
import { IplRegistryStatusBadge } from './IplRegistryStatusBadge';

export function IplRegistryValidationPanel({ items }: { items?: IplRegistryValidationItem[] | undefined }) {
  const rows = items ?? [];
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
      <h3 className="text-sm font-black text-white">IPL Validation Criteria</h3>
      <p className="mt-1 text-xs text-slate-500">Mandatory criteria must pass before the registry record can be approved or used as a study IPL candidate.</p>
      <div className="mt-3 space-y-2">
        {rows.length ? rows.map((item) => (
          <div key={item.criteria_key} className="rounded-lg border border-cyan-300/10 bg-[#071525] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-100">{item.criteria_label}</div>
                <div className="mt-1 text-xs text-slate-500">{item.mandatory ? 'Mandatory' : 'Optional'} · Evidence {item.evidence_required ? item.evidence_status : 'not required'}</div>
              </div>
              <IplRegistryStatusBadge value={item.status} />
            </div>
            {item.notes ? <p className="mt-2 text-xs text-slate-400">{item.notes}</p> : null}
          </div>
        )) : <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">No validation criteria are configured yet.</div>}
      </div>
    </section>
  );
}
