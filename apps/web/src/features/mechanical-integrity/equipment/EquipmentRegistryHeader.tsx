import Link from 'next/link';
import { Download, FileUp, Plus } from 'lucide-react';

export function EquipmentRegistryHeader({ total, lastUpdated, onImport }: { total: number; lastUpdated: string; onImport: () => void }) {
  return (
    <header className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipment Registry</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Manage site assets, critical equipment, safeguards, inspections, and lifecycle history.</p>
        <p className="mt-2 text-xs text-[var(--psm-muted)]">{total} equipment records. Last updated {new Date(lastUpdated).toLocaleString()}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/mechanical-integrity/equipment/new" className="psm-button psm-button-primary"><Plus size={16} /> Add Equipment</Link>
        <button type="button" className="psm-button psm-button-secondary" onClick={onImport}><FileUp size={16} /> Import</button>
        <a href="/api/v1/mechanical-integrity/equipment/export" className="psm-button psm-button-secondary"><Download size={16} /> Export</a>
      </div>
    </header>
  );
}
