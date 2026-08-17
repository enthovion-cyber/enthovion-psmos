import { PsiApprovalDetailPage } from '@/features/psi/review-approval/PsiApprovalDetailPage';

export default function Page({ params }: { params: { approvalId: string } }) {
  return <PsiApprovalDetailPage approvalId={params.approvalId} />;
}
