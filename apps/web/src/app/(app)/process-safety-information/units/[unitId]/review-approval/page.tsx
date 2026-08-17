import { ScopedPsiApprovalPage } from '@/features/psi/review-approval/PsiReviewApprovalPanels';

export default function Page({ params }: { params: { unitId: string } }) {
  return <ScopedPsiApprovalPage unitId={params.unitId} />;
}
