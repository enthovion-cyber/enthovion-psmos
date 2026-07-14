import { AlertTriangle, FileDown, GitBranch, Plus, TimerReset } from 'lucide-react';
import Link from 'next/link';

export function LopaQuickActions({ onFilter }: { onFilter: (patch: Record<string, any>) => void }) {
  return (
    <section className="flex flex-wrap gap-2 rounded-xl border border-cyan-300/10 bg-[#071525] p-3">
      <Link href="/lopa/new" className="lopa-button-secondary"><Plus size={15} /> New Manual LOPA</Link>
      <Link href="/lopa/new?source=hazop" className="lopa-button-secondary"><GitBranch size={15} /> Create from HAZOP</Link>
      <button onClick={() => onFilter({ source: 'HAZOP/PHA' })} className="lopa-button-secondary">HAZOP Required Scenarios</button>
      <button onClick={() => onFilter({ overdue: true })} className="lopa-button-secondary"><AlertTriangle size={15} /> View Overdue</button>
      <button onClick={() => onFilter({ silRequired: true })} className="lopa-button-secondary"><AlertTriangle size={15} /> View SIL Gap</button>
      <button onClick={() => onFilter({ revalidationDue: true })} className="lopa-button-secondary"><TimerReset size={15} /> Revalidation Due</button>
      <button className="lopa-button-secondary"><FileDown size={15} /> Export Register</button>
    </section>
  );
}
