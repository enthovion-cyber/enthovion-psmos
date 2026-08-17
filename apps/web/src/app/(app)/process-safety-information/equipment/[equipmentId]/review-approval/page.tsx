import { ScopedPsiApprovalPage } from '@/features/psi/review-approval/PsiReviewApprovalPanels';

export default function Page({ params }: { params: { equipmentId: string } }) {
  return <ScopedPsiApprovalPage equipmentId={params.equipmentId} />;
}
