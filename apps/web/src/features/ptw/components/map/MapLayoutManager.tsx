'use client';

import { useState } from 'react';
import { Plus, UploadCloud, X } from 'lucide-react';
import type { PTWMapData } from '../../services/ptw-map.service';
import { usePTWMapLayoutMutations, usePTWMapLayouts } from '../../hooks/usePTWMapLayout';

export function MapLayoutManager({ map, open, onClose }: { map: PTWMapData | undefined; open: boolean; onClose: () => void }) {
  const layouts = usePTWMapLayouts();
  const activeLayoutId = map?.layout?.id ?? layouts.data?.[0]?.id ?? null;
  const mutations = usePTWMapLayoutMutations(activeLayoutId);
  const [layoutName, setLayoutName] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-cyan-300/10 bg-[#07182a] p-5 shadow-2xl shadow-black">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-cyan-200">PTW Permit Map</p>
            <h2 className="text-xl font-black text-white">Map Layout Manager</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-white/10 p-2 text-slate-300 hover:bg-white/10" aria-label="Close layout manager"><X size={16} /></button>
        </div>
        <div className="mt-5 rounded-lg border border-cyan-300/10 bg-slate-950/35 p-3">
          <h3 className="text-sm font-bold text-white">Create layout</h3>
          <div className="mt-3 flex gap-2">
            <input value={layoutName} onChange={(event) => setLayoutName(event.target.value)} placeholder="Plant layout name" className="h-10 min-w-0 flex-1 rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-blue-300" />
            <button type="button" onClick={() => layoutName.trim() && mutations.createLayout.mutate({ layout_name: layoutName.trim(), layout_type: 'DATA' })} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-500"><Plus size={15} /> Add</button>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {(layouts.data ?? []).map((layout) => (
            <div key={layout.id} className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{layout.layout_name}</h3>
                  <p className="text-xs text-slate-400">{layout.layout_type} / {layout.version} / {layout.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-cyan-300/15 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/20">
                  <UploadCloud size={14} /> SVG
                  <input type="file" accept=".svg,image/svg+xml" className="hidden" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) mutations.uploadSvg.mutate({ layoutId: layout.id, file });
                  }} />
                </label>
              </div>
            </div>
          ))}
          {!layouts.data?.length ? <div className="rounded-lg border border-dashed border-cyan-300/20 p-6 text-center text-sm text-slate-400">No map layouts configured yet. The permit map will use the data-driven area map until a plant SVG or image layout is added.</div> : null}
        </div>
      </div>
    </div>
  );
}
