import Link from 'next/link';
import { Download, Plus, RefreshCw, Table2, Wrench } from 'lucide-react';

export function MiDashboardHeader({ header, onRefresh }: { header: { title: string; subtitle: string; lastUpdated: string }; onRefresh: () => void }) {
  return (
    <header className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Wrench size={14} /> Mechanical Integrity / Asset Integrity</div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{header.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--psm-muted)]">{header.subtitle}</p>
        <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated {new Date(header.lastUpdated).toLocaleString()}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/mechanical-integrity/equipment/new" className="psm-button psm-button-primary"><Plus size={16} /> Add Equipment</Link>
        <Link href="/mechanical-integrity/equipment" className="psm-button psm-button-secondary"><Table2 size={16} /> View Equipment Registry</Link>
        <button type="button" className="psm-button psm-button-secondary" title="Requires mechanical_integrity.export permission"><Download size={16} /> Export MI Summary</button>
        <button type="button" className="psm-button psm-button-secondary" onClick={onRefresh}><RefreshCw size={16} /> Refresh</button>
      </div>
    </header>
  );
}
