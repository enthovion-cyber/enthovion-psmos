'use client';

import { useState } from 'react';
import { useEquipmentDesignBasis } from '../hooks/useEquipmentDesignBasis';
import { PsiButton, PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { EquipmentDesignFilters } from './EquipmentDesignFilters';
import { EquipmentDesignHeader } from './EquipmentDesignHeader';
import { EquipmentDesignMobileCards } from './EquipmentDesignMobileCards';
import { EquipmentDesignSummaryCards } from './EquipmentDesignSummaryCards';
import { EquipmentDesignTable } from './EquipmentDesignTable';

export function EquipmentDesignRegistryPage({ unitId, equipmentId, preset }: { unitId?: string | undefined; equipmentId?: string | undefined; preset?: Record<string, unknown> | undefined }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(preset ?? {}) });
  const query = useEquipmentDesignBasis(filters, unitId, equipmentId);
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  const createHref = unitId ? `/process-safety-information/units/${unitId}/equipment-design/new` : '/process-safety-information/equipment-design/new';
  return (
    <div className="space-y-5">
      <EquipmentDesignHeader unitId={unitId} lastUpdated={query.data.lastUpdated} />
      <EquipmentDesignSummaryCards summary={query.data.summary} />
      <EquipmentDesignFilters filters={filters} onChange={setFilters} savedViews={query.data.savedViews} />
      {!query.data.rows.length ? <PsiEmptyState title="No equipment design basis records found" message="No records match this company/site/unit/equipment scope. Create a design basis or adjust filters." action={<PsiButton href={createHref}>Create Design Basis</PsiButton>} /> : <><EquipmentDesignTable rows={query.data.rows} /><EquipmentDesignMobileCards rows={query.data.rows} /></>}
    </div>
  );
}
