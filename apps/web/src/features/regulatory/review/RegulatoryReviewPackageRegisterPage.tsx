'use client';

import { useMemo, useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { useRegulatoryReviewPackages } from '../hooks/useRegulatoryReviewPackages';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, regulatoryInputClass } from '../shared/RegulatoryUi';
import { RegulatoryReviewPackageTable } from './RegulatoryReviewPackageTable';

export function RegulatoryReviewPackageRegisterPage({ view = 'packages', title }: { view?: string | undefined; title?: string | undefined }) {
  const [search, setSearch] = useState('');
  const filters = useMemo(() => search ? { search } : undefined, [search]);
  const query = useRegulatoryReviewPackages(view, filters);
  if (query.isLoading) return <RegulatoryLoadingState />;
  if (query.isError) return <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} />;
  return (
    <div className="space-y-6">
      <RegulatoryHeader title={title ?? 'Review Package Register'} subtitle="Server-side regulatory review packages with permission, scope, stale, validation and e-signature status enforced by the backend." onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/review-approval/packages/new">New Package</RegulatoryButton>} />
      <RegulatoryCard title="Filters / Search" subtitle="Search by package code, title or source record number.">
        <div className="grid gap-3 md:grid-cols-3">
          <RegulatoryField label="Search">
            <input className={regulatoryInputClass()} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Package, title, source record" />
          </RegulatoryField>
        </div>
      </RegulatoryCard>
      <RegulatoryReviewPackageTable rows={query.data?.rows ?? []} />
    </div>
  );
}
