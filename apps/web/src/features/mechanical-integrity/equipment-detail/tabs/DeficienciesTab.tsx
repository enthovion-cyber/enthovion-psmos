'use client';

import Link from 'next/link';
import { DeficiencyDashboardPage } from '../../deficiencies/DeficiencyDashboardPage';
import { DeviationDashboardPage } from '../../deviations/DeviationDashboardPage';
import { ActionButton, SectionCard } from '../../safeguards/SafeguardUiPrimitives';

export function DeficienciesTab({ equipmentId }: { equipmentId: string }) {
  return (
    <div className="space-y-5">
      <SectionCard title="Equipment Deficiencies / Deviations" description="Open deficiencies, temporary deviations, startup blockers, readiness impacts, and corrective links scoped to this equipment.">
        <div className="flex flex-wrap gap-2">
          <Link href={`/mechanical-integrity/equipment/${equipmentId}/deficiencies/new`}><ActionButton>Create Equipment Deficiency</ActionButton></Link>
          <Link href={`/mechanical-integrity/deviations/new?equipmentId=${equipmentId}`}><ActionButton>Create Equipment Deviation</ActionButton></Link>
          <Link href={`/mechanical-integrity/equipment/${equipmentId}/deficiencies`}><ActionButton>Open Deficiency Register</ActionButton></Link>
          <Link href={`/mechanical-integrity/equipment/${equipmentId}/deviations`}><ActionButton>Open Deviation Register</ActionButton></Link>
        </div>
      </SectionCard>
      <DeficiencyDashboardPage initialFilters={{ equipmentId }} />
      <DeviationDashboardPage initialFilters={{ equipmentId }} />
    </div>
  );
}
