import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav: Array<[string, string]> = [
  ['Dashboard', '/regulatory/dashboard'],
  ['Regulatory Register', '/regulatory/register'],
  ['Add Requirement', '/regulatory/new'],
  ['Jurisdiction Dashboard', '/regulatory/jurisdictions/dashboard'],
  ['Jurisdictions', '/regulatory/jurisdictions'],
  ['Authorities / Regulators', '/regulatory/authorities'],
  ['Standards / Regulations Library Foundation', '/regulatory/library'],
  ['Applicability Dashboard', '/regulatory/applicability'],
  ['Applicability Matrix', '/regulatory/applicability/matrix'],
  ['Applicability Assessments', '/regulatory/applicability/assessments'],
  ['Applicability Profiles', '/regulatory/applicability/profiles'],
  ['Applicability Gaps', '/regulatory/applicability/gaps'],
  ['Obligations', '/regulatory/obligations'],
  ['Compliance Status', '/regulatory/compliance-status'],
  ['Evidence', '/regulatory/evidence'],
  ['Audit Mapping', '/regulatory/audit-mapping'],
  ['Actions / CAPA Foundation', '/regulatory/actions'],
  ['Review & Approval Foundation', '/regulatory/review-approval'],
  ['Reports / Export Foundation', '/regulatory/reports'],
  ['History', '/regulatory/history'],
  ['Settings', '/regulatory/settings']
];

export function RegulatorySidebar() {
  const pathname = usePathname();
  return (
    <aside className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
      <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[.16em] text-[var(--psm-muted)]">Regulatory</div>
      <nav className="grid gap-1">
        {nav.map(([label, href]) => {
          const active = pathname === href || (href !== '/regulatory/dashboard' && pathname.startsWith(`${href}/`));
          return <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-fg)]'}`}>{label}</Link>;
        })}
      </nav>
    </aside>
  );
}
