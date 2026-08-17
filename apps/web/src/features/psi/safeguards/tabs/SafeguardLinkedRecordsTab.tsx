import { PsiCard } from '../../shared/PsiUi';
import type { SafeguardDetail } from '../../types/safeguard.types';
import { SafeguardListPanel } from '../SafeguardPrimitives';

export function SafeguardLinkedRecordsTab({ detail }: { detail: SafeguardDetail }) {
  return <div className="space-y-5"><PsiCard title="Linked Records" subtitle="Integration foundation for Process Chemistry, SOL, Relief, Material Compatibility, Electrical Classification, Drawings, MI, HAZOP, LOPA, MOC, PSSR, PTW, LOTO, Training, Audit, and Action Engine."><p className="text-sm text-[var(--psm-muted)]">Source links and hazard links below are the backend-controlled relationship foundation consumed by downstream PSI completeness, PSSR, MOC, MI, HAZOP, LOPA, PTW/LOTO, Training, Audit, and Action Engine workflows.</p></PsiCard><SafeguardListPanel title="Hazard / Scenario Links" rows={detail.hazardLinks} emptyTitle="No hazard links" emptyMessage="No hazard/scenario relationships returned." /><SafeguardListPanel title="Source Module Links" rows={detail.sourceLinks} emptyTitle="No source links" emptyMessage="No source module relationships returned." /></div>;
}
