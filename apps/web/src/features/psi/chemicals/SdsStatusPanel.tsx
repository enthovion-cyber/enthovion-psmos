import { SdsStatusBadge } from '../shared/SdsStatusBadge';
import { PsiCard } from '../shared/PsiUi';
import type { PsiChemicalDetail } from '../types/psi-chemical.types';

export function SdsStatusPanel({ detail }: { detail: PsiChemicalDetail }) {
  return <PsiCard title="SDS Status Engine" subtitle="Backend calculated official SDS state."><div className="space-y-3"><SdsStatusBadge status={detail.chemical.sds_status} /><p className="text-sm text-[var(--psm-muted)]">{detail.chemical.sds_status === 'Current' ? 'SDS is linked, approved/current, and not expired.' : detail.chemical.sds_status === 'Expired' ? 'SDS expiry/review date is past due and affects PSI completeness.' : detail.chemical.sds_status === 'Missing' ? 'No active SDS link or approved waiver exists.' : 'SDS requires review/approval or waiver handling.'}</p>{detail.chemical.high_hazard && ['Missing', 'Expired'].includes(String(detail.chemical.sds_status)) ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">High-hazard chemical with missing/expired SDS is a critical PSI gap and may block PSSR.</div> : null}</div></PsiCard>;
}
