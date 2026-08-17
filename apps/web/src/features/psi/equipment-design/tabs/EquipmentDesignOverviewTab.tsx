import { EquipmentDesignCompletenessPanel } from '../EquipmentDesignCompletenessPanel';
import { EquipmentDesignConflictPanel } from '../EquipmentDesignConflictPanel';
import { EquipmentDesignFieldGrid, valueOf } from '../EquipmentDesignFieldGrid';
import { DesignRatingComparisonPanel } from '../DesignRatingComparisonPanel';
import { PsiCard, PsiMetricCard } from '../../shared/PsiUi';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

export function EquipmentDesignOverviewTab({ detail }: { detail: EquipmentDesignDetail }) {
  const basis = detail.designBasis;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {detail.overview.cards.map((card) => <PsiMetricCard key={card.label} label={card.label} value={String(card.value ?? '-')} tone={card.tone ?? 'neutral'} />)}
      </div>
      <PsiCard title="Equipment Identity Snapshot" subtitle="Current backend source of truth for unit, equipment, ownership, criticality, and review fields.">
        <EquipmentDesignFieldGrid items={[
          { label: 'Unit', value: basis.unit_id },
          { label: 'Area', value: basis.area_id ?? 'Not assigned' },
          { label: 'Equipment ID', value: basis.equipment_id },
          { label: 'Equipment type', value: basis.equipment_type },
          { label: 'Category', value: basis.equipment_category ?? 'Not provided' },
          { label: 'System / service', value: basis.system_service ?? 'Not provided' },
          { label: 'Safety critical', value: basis.safety_critical ? 'Yes' : 'No' },
          { label: 'PSM critical', value: basis.psm_critical ? 'Yes' : 'No' },
          { label: 'Next review due', value: basis.next_review_due ? new Date(basis.next_review_due).toLocaleDateString() : 'Not scheduled' }
        ]} />
      </PsiCard>
      <DesignRatingComparisonPanel ratings={detail.ratings} basis={basis} />
      <PsiCard title="Readiness Impact Snapshot" subtitle="How this design basis affects PSI completeness, MI readiness, PSSR, MOC, and review workflows.">
        <EquipmentDesignFieldGrid items={[
          { label: 'Completeness status', value: basis.completeness_status },
          { label: 'Conflict status', value: basis.conflict_status },
          { label: 'Review status', value: basis.review_status },
          { label: 'MOC update required', value: valueOf(basis as unknown as Record<string, unknown>, 'moc_update_required') },
          { label: 'PSSR blocker', value: valueOf(basis as unknown as Record<string, unknown>, 'pssr_blocker') },
          { label: 'MI readiness impact', value: valueOf(basis as unknown as Record<string, unknown>, 'mi_readiness_impact') }
        ]} />
      </PsiCard>
      <div className="grid gap-5 xl:grid-cols-2">
        <EquipmentDesignCompletenessPanel checks={detail.completeness} />
        <EquipmentDesignConflictPanel conflicts={detail.conflicts} />
      </div>
    </div>
  );
}
