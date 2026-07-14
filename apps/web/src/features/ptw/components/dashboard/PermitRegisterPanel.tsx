import type { Permit } from '@/services/ptw.service';
import { PermitListItem } from './PermitListItem';

interface PermitRegisterPanelProps {
  permits: Permit[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  page: number;
  onPage: (page: number) => void;
}

export function PermitRegisterPanel({
  permits,
  selectedId,
  loading,
  onSelect,
  page,
  onPage,
}: PermitRegisterPanelProps) {
  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/40 backdrop-blur-md shadow-2xl shadow-black/40 transition-all duration-300">
      
      {/* Header Sticky Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            Active Permits 
            <span className="ml-1.5 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-slate-700/50">
              {permits.length}
            </span>
          </h2>
        </div>
        <span className="text-[10px] font-medium tracking-wide text-slate-400/80">
          Live Preview Monitor
        </span>
      </div>

      {/* Main Content Area - Scrollbar Optimized & Viewport Flex Adaptive */}
      <div className="custom-scrollbar max-h-[580px] min-h-[350px] flex-1 overflow-y-auto bg-slate-950/20 px-1 py-2 divide-y divide-slate-900/40">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div 
              key={index} 
              className="mx-3 my-2 h-[76px] animate-pulse rounded-lg bg-gradient-to-r from-slate-900/60 to-slate-900/20 border border-slate-900" 
            />
          ))
        ) : null}

        {!loading && permits.map((permit) => (
          <div 
            key={permit.id}
            className={`mx-2 my-1.5 rounded-lg transition-all duration-200 border ${
              selectedId === permit.id 
                ? 'border-cyan-500/30 bg-cyan-950/10 shadow-lg shadow-cyan-950/10' 
                : 'border-transparent hover:border-slate-800 hover:bg-slate-900/20'
            }`}
          >
            <PermitListItem 
              permit={permit} 
              selected={selectedId === permit.id} 
              onSelect={() => onSelect(permit.id)} 
            />
          </div>
        ))}

        {!loading && !permits.length ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <svg className="h-8 w-8 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs text-slate-400 font-medium">No active industrial permits match criteria.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Adjust filter settings to scan wider area sectors.</p>
          </div>
        ) : null}
      </div>

      {/* Footer Navigation Sticky Bar */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-slate-800/80 bg-slate-900/60 px-4 py-3 backdrop-blur-md">
        <button 
          className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-all hover:border-slate-700 hover:bg-slate-900 hover:text-white disabled:pointer-events-none disabled:opacity-30" 
          disabled={page <= 1} 
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Log Page</span>
          <span className="rounded bg-slate-950 px-2 py-0.5 text-xs font-mono font-bold text-slate-200 border border-slate-800/60">
            {page}
          </span>
        </div>

        <button 
          className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-all hover:border-slate-700 hover:bg-slate-900 hover:text-white disabled:pointer-events-none disabled:opacity-30" 
          disabled={permits.length < 25} 
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>

      {/* Embedded Global Scroll Styling Rule */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.4);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.4);
        }
      `}</style>
    </section>
  );
}