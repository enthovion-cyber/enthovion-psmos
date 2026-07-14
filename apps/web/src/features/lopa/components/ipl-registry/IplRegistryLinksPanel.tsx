'use client';

import type { IplRegistryRecord } from '../../types/lopa-ipl-registry.types';

export function IplRegistryLinksPanel({ record }: { record: IplRegistryRecord }) {
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
      <h3 className="text-sm font-black text-white">Equipment & Document Links</h3>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-bold uppercase text-slate-500">Equipment</div>
          {(record.equipmentLinks ?? []).length ? record.equipmentLinks?.map((link) => (
            <div key={link.id} className="mb-2 rounded-lg border border-cyan-300/10 bg-[#071525] p-3 text-sm">
              <div className="font-bold text-slate-100">{link.equipment_tag || link.equipment_name || link.equipment_id}</div>
              <div className="text-xs text-slate-500">{link.equipment_type || '-'} · {link.link_type}</div>
            </div>
          )) : <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">No Equipment Registry links.</div>}
        </div>
        <div>
          <div className="mb-2 text-xs font-bold uppercase text-slate-500">Documents</div>
          {(record.documentLinks ?? []).length ? record.documentLinks?.map((link) => (
            <div key={link.id} className="mb-2 rounded-lg border border-cyan-300/10 bg-[#071525] p-3 text-sm">
              <div className="font-bold text-slate-100">{link.document_number || link.document_title || link.document_id}</div>
              <div className="text-xs text-slate-500">{link.document_type || '-'} · Rev {link.revision || '-'} · {link.link_type}</div>
            </div>
          )) : <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">No Document Control links.</div>}
        </div>
      </div>
    </section>
  );
}
