import { CompatibilityCheckPanel } from '../CompatibilityCheckPanel';
import { Field, FieldGrid } from '../MaterialCompatibilityPrimitives';
import { MaterialRiskMatrix } from '../MaterialRiskMatrix';
import { PsiCard } from '../../shared/PsiUi';
import type { MaterialCompatibilityDetail } from '../../types/material-compatibility.types';

export function CompatibilityOverviewTab({ detail }: { detail: MaterialCompatibilityDetail }) {
  const row = detail.compatibility;
  return <div className="space-y-5"><CompatibilityCheckPanel detail={detail} /><PsiCard title="Overview Snapshot" subtitle="Core PSI truth-layer values used by Equipment Design Basis, MI, PSSR, MOC, HAZOP/LOPA, PTW, and review readiness."><FieldGrid><Field label="Status" value={row.compatibility_status} /><Field label="Review status" value={row.review_status} /><Field label="Scope" value={row.compatibility_scope} warn={!row.compatibility_scope} /><Field label="Chemical" value={row.chemical_name || detail.serviceConditions?.chemical_name || row.chemical_id} warn={!row.chemical_name && !detail.serviceConditions?.chemical_name && !row.chemical_id} /><Field label="Material" value={row.material_family || detail.materialDetails?.material_family} warn={!row.material_family && !detail.materialDetails?.material_family} /><Field label="Component" value={row.component_type} warn={!row.component_type} /><Field label="Criticality" value={row.criticality} /><Field label="Next review" value={row.next_review_due ? new Date(row.next_review_due).toLocaleDateString() : null} warn={!row.next_review_due} /><Field label="Evidence" value={row.evidence_status} warn={row.evidence_status !== 'Linked'} /></FieldGrid></PsiCard><MaterialRiskMatrix mechanisms={detail.degradationMechanisms} /></div>;
}

