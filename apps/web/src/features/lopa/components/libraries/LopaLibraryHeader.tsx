import Link from 'next/link';
import { BookOpen, Download, Plus, RefreshCw } from 'lucide-react';

export function LopaLibraryHeader({ title, subtitle, onNew, onRefresh }: { title: string; subtitle: string; onNew?: () => void; onRefresh?: () => void }) {
  return (
    <header className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4 shadow-xl shadow-black/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-300"><BookOpen size={14} /> LOPA / SIL Libraries</div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h1>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/lopa/libraries" className="lopa-button-secondary">Library Home</Link>
          <button onClick={onRefresh} className="lopa-button-secondary"><RefreshCw size={14} /> Refresh</button>
          <button onClick={() => window.print()} className="lopa-button-secondary"><Download size={14} /> Export</button>
          {onNew ? <button onClick={onNew} className="lopa-button-primary"><Plus size={14} /> New Record</button> : null}
        </div>
      </div>
    </header>
  );
}
