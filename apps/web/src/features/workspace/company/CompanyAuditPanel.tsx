export function CompanyAuditPanel() {
  return (
    <section className="psm-card p-5">
      <h2 className="text-lg font-semibold">Company Audit</h2>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">Company/site setup mutations are written through the backend audit log. Full audit register integration can read `/settings/company/audit` when the audit API is exposed.</p>
    </section>
  );
}
