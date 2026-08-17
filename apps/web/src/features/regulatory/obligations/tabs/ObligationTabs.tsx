import Link from 'next/link';

export const obligationTabs = [
  ['Overview', 'overview'],
  ['Scope', 'scope'],
  ['Applicability', 'applicability'],
  ['Evidence Expectations', 'evidence-expectations'],
  ['Module Mapping', 'module-mapping'],
  ['Compliance Status', 'compliance-status'],
  ['Audit Mapping', 'audit-mapping'],
  ['Actions / CAPA', 'actions'],
  ['Review', 'review'],
  ['Reports', 'reports'],
  ['History', 'history']
] as const;

export function ObligationTabs({ obligationId, section }: { obligationId: string; section: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {obligationTabs.map(([label, key]) => (
        <Link key={key} href={`/regulatory/obligations/${obligationId}${key === 'overview' ? '' : `/${key}`}`} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold ${section === key ? 'border-primary bg-primary text-white' : 'border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-muted)]'}`}>
          {label}
        </Link>
      ))}
    </div>
  );
}
