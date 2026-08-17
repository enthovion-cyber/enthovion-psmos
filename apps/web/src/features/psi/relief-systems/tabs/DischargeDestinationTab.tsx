import { PsiCard } from '../../shared/PsiUi';
import type { ReliefSystemDetail } from '../../types/relief-system.types';
import { ReliefSystemFieldGrid, valueOf } from '../ReliefSystemFieldGrid';

export function DischargeDestinationTab({ detail }: { detail: ReliefSystemDetail }) {
  const row = detail.dischargeDestination ?? detail.reliefBasis;
  const fields = row as Record<string, unknown>;
  return (
    <PsiCard title="Discharge / Destination" subtitle="Relief discharge path, flare/scrubber/atmosphere basis, environmental review, backpressure, header capacity, and restricted release controls.">
      <ReliefSystemFieldGrid items={[
        { label: 'Relief destination', value: valueOf(row, 'relief_destination'), tone: row.relief_destination ? 'normal' : 'warn' },
        { label: 'Destination detail', value: valueOf(row, 'destination_detail') },
        { label: 'Flare / vent header', value: valueOf(row, 'flare_header') },
        { label: 'Backpressure', value: `${valueOf(row, 'backpressure', 'Not provided')} ${valueOf(row, 'backpressure_unit', '')}` },
        { label: 'Disposal system capacity', value: valueOf(row, 'disposal_system_capacity') },
        { label: 'Atmospheric release allowed', value: valueOf(row, 'atmospheric_release_allowed') },
        { label: 'Toxic/flammable concern', value: valueOf(row, 'toxic_or_flammable_discharge'), tone: fields.toxic_or_flammable_discharge ? 'danger' : 'normal' },
        { label: 'Environmental review required', value: valueOf(row, 'environmental_review_required') },
        { label: 'Destination notes', value: valueOf(row, 'destination_notes') }
      ]} />
    </PsiCard>
  );
}
