'use client';

import { RegulatoryHeader } from './RegulatoryHeader';
import { RegulatoryLayout } from './layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryButton } from './shared/RegulatoryUi';

export function RegulatoryPlaceholderPage({ title }: { title: string }) {
  return (
    <RegulatoryLayout current={title}>
      <div className="space-y-5">
        <RegulatoryHeader title={title} subtitle="Controlled navigation placeholder for a later Regulatory Register phase." />
        <RegulatoryCard title={title} subtitle="Phase 1 foundation boundary">
          <p className="text-sm text-[var(--psm-muted)]">
            This phase is not implemented yet. The Regulatory Register foundation intentionally avoids duplicating full obligation, legal applicability, evidence, action, review, update-feed, and report engines until those phases are built.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <RegulatoryButton href="/regulatory/register" variant="secondary">Open Register</RegulatoryButton>
            <RegulatoryButton href="/regulatory/new">Add Requirement</RegulatoryButton>
          </div>
        </RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}
