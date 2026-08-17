"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const auditNav = [
  ["/audit-compliance/dashboard", "Dashboard", false],
  ["/audit-compliance/programs", "Audit Program Register", false],
  ["/audit-compliance/plans", "Audit Plan / Schedule", false],
  ["/audit-compliance/checklists", "Checklist Builder", false],
  ["/audit-compliance/execution", "Audit Execution", false],
  ["/audit-compliance/findings", "Findings Register", false],
  ["/audit-compliance/capa", "CAPA / Action Integration", false],
  ["/audit-compliance/evidence", "Evidence Collection", false],
  ["/audit-compliance/scoring", "Compliance Scoring", false],
  [
    "/audit-compliance/standards-mapping",
    "Standards / Regulatory Mapping",
    false,
  ],
  ["/audit-compliance/review-approval", "Review & Approval", false],
  ["/audit-compliance/reports", "Reports / Export", false],
  ["/audit-compliance/history", "History / Trends", false],
  ["/audit-compliance/settings", "Settings", false],
] as const;

export function AuditSidebar() {
  const pathname = usePathname();
  return (
    <nav className="grid gap-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 text-sm lg:sticky lg:top-20">
      {auditNav.map(([href, label, future]) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-fg)] ${pathname.startsWith(href) ? "bg-primary/10 font-semibold text-primary" : "text-[var(--psm-muted)]"}`}
        >
          <span>{label}</span>
          {future ? (
            <span className="rounded-full bg-[var(--psm-surface-3)] px-2 py-0.5 text-[10px] uppercase">
              Future
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
