'use client';

import Link from 'next/link';
import { ArrowLeft, LayoutTemplate, RefreshCcw, SatelliteDish } from 'lucide-react';
import type { PTWMapData } from '../../services/ptw-map.service';

export function PermitMapHeader({ map, mode, onModeChange, onRefresh, refreshing, onOpenLayouts }: { map: PTWMapData | undefined; mode: string; onModeChange: (mode: 'AUTO' | 'SVG' | 'DATA' | 'IMAGE') => void; onRefresh: () => void; refreshing: boolean; onOpenLayouts: () => void }) {
  return (
    <header className="flex flex-col gap-4 border-b border-cyan-300/10 bg-[#04101f]/95 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <Link href="/ptw" className="rounded-md border border-white/10 p-2 text-slate-300 hover:bg-white/10" aria-label="Back to PTW dashboard"><ArrowLeft size={16} /></Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-200">Permit to Work</p>
            <h1 className="text-2xl font-black text-white">Live Permit Map</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-400">Active site control view for permits, equipment, SIMOPS conflicts, gas, isolation, handover, and expiring work.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">
          <SatelliteDish size={14} /> {map?.realtime?.connected ? 'Realtime connected' : 'Realtime standby'}
        </span>
        <select value={mode} onChange={(event) => onModeChange(event.target.value as 'AUTO' | 'SVG' | 'DATA' | 'IMAGE')} className="rounded-md border border-cyan-300/15 bg-[#07182a] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-blue-300">
          <option value="AUTO">Auto mode</option>
          <option value="SVG">SVG layout</option>
          <option value="DATA">Area map</option>
          <option value="IMAGE">Image layout</option>
        </select>
        <button type="button" onClick={onOpenLayouts} className="inline-flex items-center gap-2 rounded-md border border-cyan-300/15 bg-cyan-500/10 px-3 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20"><LayoutTemplate size={15} /> Layouts</button>
        <button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex items-center gap-2 rounded-md border border-blue-300/20 bg-blue-500/15 px-3 py-2 text-sm font-bold text-blue-100 hover:bg-blue-500/25 disabled:opacity-60"><RefreshCcw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh</button>
      </div>
    </header>
  );
}
