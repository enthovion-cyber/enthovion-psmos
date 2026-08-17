import Link from 'next/link';
import { Download, FileText, Plus, Table2 } from 'lucide-react';

export function MiQuickActions() {
  const actions = [
    { label: 'Add Equipment', href: '/mechanical-integrity/equipment/new', icon: Plus },
    { label: 'Import Equipment', href: '/mechanical-integrity/equipment?import=1', icon: FileText },
    { label: 'View Registry', href: '/mechanical-integrity/equipment', icon: Table2 },
    { label: 'Export Registry', href: '/mechanical-integrity/equipment?export=1', icon: Download },
    { label: 'View Overdue Inspections', href: '/mechanical-integrity/equipment?view=overdue-inspections', icon: Table2 },
    { label: 'View Active Bypasses', href: '/mechanical-integrity/equipment?view=active-bypasses', icon: Table2 },
    { label: 'View Critical Deficiencies', href: '/mechanical-integrity/equipment?view=critical-deficiencies', icon: Table2 },
    { label: 'View Startup Blockers', href: '/mechanical-integrity/equipment?view=startup-blockers', icon: Table2 },
    { label: 'Generate MI Summary Report', href: '/mechanical-integrity?report=summary', icon: FileText }
  ];
  return (
    <section className="psm-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Quick Actions</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return <Link key={action.label} href={action.href} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm font-semibold hover:bg-[var(--psm-surface-2)]"><Icon size={16} /> {action.label}</Link>;
        })}
      </div>
    </section>
  );
}
