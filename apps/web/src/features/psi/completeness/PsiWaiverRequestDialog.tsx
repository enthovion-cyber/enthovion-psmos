import { PsiCard } from '../shared/PsiUi';

export function PsiWaiverRequestDialog() {
  return <PsiCard title="Waiver Request" subtitle="Waivers require backend approval workflow, expiry, compensating controls, and audit/history records."><p className="text-sm text-[var(--psm-muted)]">Select a gap from the gap register to request a waiver with reason, expiry, and controls.</p></PsiCard>;
}
