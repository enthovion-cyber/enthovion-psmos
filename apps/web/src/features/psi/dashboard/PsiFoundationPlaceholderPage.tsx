import { PsiCard } from '../shared/PsiUi';

export function PsiFoundationPlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-primary">Process Safety Information</p>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">{description}</p>
      </div>
      <PsiCard title="Foundation Ready" subtitle="This PSI phase creates routes, permissions, and backend-ready structure without fake production data.">
        <p className="text-sm text-[var(--psm-muted)]">This submodule is intentionally not fully built in Phase 1. It is available as a controlled placeholder so later PSI phases can connect real structured data, Document Control links, review status, and completeness impact without changing navigation.</p>
      </PsiCard>
    </div>
  );
}
