'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { usePTWMap } from '../../hooks/usePTWMap';
import { usePTWMapStore } from '../../stores/ptw-map.store';
import { MapLayoutManager } from './MapLayoutManager';
import { MapRightPanel } from './MapRightPanel';
import { PermitMapCanvas } from './PermitMapCanvas';
import { PermitMapFilters } from './PermitMapFilters';
import { PermitMapHeader } from './PermitMapHeader';

export function PTWPermitMapPage() {
  const { filters, mode, selected, rightPanelOpen, layoutManagerOpen, setFilters, resetFilters, setMode, select, setRightPanelOpen, setLayoutManagerOpen } = usePTWMapStore();
  const mapQuery = usePTWMap({ ...filters, ...(mode !== 'AUTO' ? { mode } as any : {}) });
  const map = mapQuery.data;

  return (
    <div className="min-h-screen bg-[#020b16] text-slate-100">
      <PermitMapHeader map={map} mode={mode} onModeChange={setMode} onRefresh={() => mapQuery.refetch()} refreshing={mapQuery.isFetching} onOpenLayouts={() => setLayoutManagerOpen(true)} />
      <main className="space-y-4 p-4">
        <PermitMapFilters filters={filters} onChange={setFilters} onReset={resetFilters} />
        {mapQuery.isLoading ? <LoadingState /> : null}
        {mapQuery.isError ? <ErrorState onRetry={() => mapQuery.refetch()} /> : null}
        {map ? (
          <>
            <SummaryStrip summary={map.summary} generatedAt={map.generatedAt} />
            <div className={`grid gap-4 ${rightPanelOpen ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : 'xl:grid-cols-1'}`}>
              <PermitMapCanvas map={map} selected={selected} onSelect={select} />
              {rightPanelOpen ? <MapRightPanel map={map} selected={selected} onClose={() => setRightPanelOpen(false)} onSelect={select} /> : (
                <button type="button" onClick={() => setRightPanelOpen(true)} className="fixed bottom-5 right-5 rounded-full border border-blue-300/30 bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-blue-950/40">Open Inspector</button>
              )}
            </div>
          </>
        ) : null}
      </main>
      <MapLayoutManager map={map} open={layoutManagerOpen} onClose={() => setLayoutManagerOpen(false)} />
    </div>
  );
}

function SummaryStrip({ summary, generatedAt }: { summary: Record<string, number>; generatedAt: string }) {
  const cards = [
    ['Active permits', summary.active ?? 0, 'text-emerald-300'],
    ['High risk', summary.highRisk ?? 0, 'text-amber-300'],
    ['Critical', summary.criticalRisk ?? 0, 'text-red-300'],
    ['Conflicts', summary.conflicts ?? 0, 'text-red-300'],
    ['Gas due', summary.gasDue ?? 0, 'text-cyan-300'],
    ['Expiring', summary.expiring ?? 0, 'text-amber-300']
  ] as const;
  return (
    <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map(([label, value, tone]) => (
        <div key={label} className="rounded-lg border border-cyan-300/10 bg-[#07182a]/95 p-3">
          <p className="text-xs text-slate-400">{label}</p>
          <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
        </div>
      ))}
      <p className="sr-only">Generated at {generatedAt}</p>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="grid min-h-[420px] place-items-center rounded-xl border border-cyan-300/10 bg-[#07182a]/95">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-blue-300" size={30} />
        <p className="mt-3 text-sm font-semibold text-slate-300">Loading live permit map...</p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-300/20 bg-red-500/10 p-5 text-red-100">
      <div className="flex items-center gap-3">
        <AlertTriangle size={20} />
        <div>
          <h2 className="font-bold">Unable to load PTW permit map</h2>
          <p className="text-sm text-red-100/75">Check the API server and Supabase map tables, then retry.</p>
        </div>
      </div>
      <button type="button" onClick={onRetry} className="mt-4 rounded-md border border-red-200/30 px-3 py-2 text-sm font-bold hover:bg-red-500/15">Retry</button>
    </div>
  );
}
