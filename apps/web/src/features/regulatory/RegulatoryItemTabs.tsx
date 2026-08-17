import Link from 'next/link';

const tabs = [
  ['Overview', ''],
  ['Jurisdictions', 'jurisdictions'],
  ['Scope', 'scope'],
  ['Applicability', 'applicability'],
  ['Obligations', 'obligations'],
  ['Compliance Status', 'compliance-status'],
  ['Evidence', 'evidence'],
  ['Audit Mapping', 'audit-mapping'],
  ['Actions', 'actions'],
  ['Review', 'review'],
  ['Reports', 'reports'],
  ['History', 'history']
];

export function RegulatoryItemTabs({ id, active }: { id: string; active: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">
      <div className="flex min-w-max gap-2">
        {tabs.map(([label, slug]) => {
          const href = slug ? `/regulatory/${id}/${slug}` : `/regulatory/${id}`;
          const selected = active === (slug || 'overview');
          return <Link key={slug || 'overview'} href={href} className={`rounded-lg px-3 py-2 text-sm font-semibold ${selected ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-fg)]'}`}>{label}</Link>;
        })}
      </div>
    </div>
  );
}
