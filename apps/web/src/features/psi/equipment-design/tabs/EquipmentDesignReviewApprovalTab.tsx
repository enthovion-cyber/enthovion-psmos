import { EquipmentDesignFieldGrid } from '../EquipmentDesignFieldGrid';
import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

export function EquipmentDesignReviewApprovalTab({ detail }: { detail: EquipmentDesignDetail }) {
  const basis = detail.designBasis;
  return (
    <div className="space-y-5">
      <PsiCard title="Review & Approval" subtitle="Backend-controlled review state. Approved records are used by PSI readiness, MI readiness, PSSR, MOC, and audit/reporting workflows.">
        <EquipmentDesignFieldGrid items={[
          { label: 'Review status', value: basis.review_status },
          { label: 'Design basis status', value: basis.status },
          { label: 'Completeness', value: `${basis.completeness_status} (${basis.completeness_score ?? 0}%)` },
          { label: 'Conflict status', value: basis.conflict_status },
          { label: 'Next review due', value: basis.next_review_due ? new Date(basis.next_review_due).toLocaleDateString() : 'Not scheduled' },
          { label: 'MOC required', value: basis.moc_update_required ? 'Yes' : 'No' },
          { label: 'PSSR blocker', value: basis.pssr_blocker ? 'Yes' : 'No' },
          { label: 'MI readiness impact', value: basis.mi_readiness_impact ? 'Yes' : 'No' }
        ]} />
      </PsiCard>
      <PsiCard title="Approval Blockers" subtitle="Readiness and conflicts are backend-generated; users cannot manually fake approval readiness.">
        <ul className="space-y-2 text-sm text-[var(--psm-muted)]">
          {detail.completeness.filter((check) => String(check.status ?? '').toLowerCase() !== 'complete').map((check) => <li key={String(check.id ?? check.requirement_key)}>Missing: {String(check.requirement_label ?? check.requirement_key)}</li>)}
          {detail.conflicts.filter((conflict) => String(conflict.status ?? '').toLowerCase() !== 'resolved').map((conflict) => <li key={String(conflict.id ?? conflict.conflict_key)}>Conflict: {String(conflict.conflict_title ?? conflict.conflict_key)}</li>)}
          {!detail.completeness.length && !detail.conflicts.length ? <li>No blockers returned by backend.</li> : null}
        </ul>
      </PsiCard>
    </div>
  );
}
