import Link from 'next/link';
import { AlertTriangle, Download, FilePlus2, ShieldAlert, UserCheck } from 'lucide-react';

export function HazopDashboardQuickActions({ onExport, onFilter }: { onExport: () => void; onFilter: (key: string, value: any) => void }) {
  const actions = [
    { label: 'Create HAZOP Study', href: '/hazop/new', icon: FilePlus2 },
    { label: 'Start Revalidation', onClick: () => onFilter('revalidationDue', true), icon: ShieldAlert },
    { label: 'View Overdue Recs', onClick: () => onFilter('overdue', true), icon: AlertTriangle },
    { label: 'View LOPA Required', onClick: () => onFilter('lopaRequired', true), icon: ShieldAlert },
    { label: 'View Pending Sign-Offs', onClick: () => onFilter('pendingSignoff', true), icon: UserCheck },
    { label: 'Export Dashboard', onClick: onExport, icon: Download }
  ];
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h3 className="mb-3 font-semibold">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = <><span className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-blue-200"><Icon size={18} /></span><span className="text-xs font-semibold">{action.label}</span></>;
          if (action.href) return <Link key={action.label} href={action.href} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-[var(--psm-line)] text-center hover:bg-[var(--psm-surface-2)]">{content}</Link>;
          return <button key={action.label} type="button" onClick={action.onClick} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-[var(--psm-line)] text-center hover:bg-[var(--psm-surface-2)]">{content}</button>;
        })}
      </div>
    </section>
  );
}
