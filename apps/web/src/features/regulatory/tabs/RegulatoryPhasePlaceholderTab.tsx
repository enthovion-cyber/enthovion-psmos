import { RegulatoryCard } from '../shared/RegulatoryUi';

export function RegulatoryPhasePlaceholderTab({ title }: { title: string }) {
  return (
    <RegulatoryCard title={title} subtitle="Controlled Phase 1 integration point">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-[var(--psm-fg)]">
        This phase is not implemented yet. Phase 1 preserves the navigation, permissions, backend section endpoint, audit-safe placeholders, and register foundation fields without creating a duplicate obligation, evidence, action, review, or report engine.
      </div>
    </RegulatoryCard>
  );
}
