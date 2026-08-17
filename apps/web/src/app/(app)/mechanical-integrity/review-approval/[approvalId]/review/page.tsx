import { ApprovalDetailPage } from '@/features/mechanical-integrity/review-approval/ApprovalDetailPage';

export default async function MechanicalIntegrityApprovalReviewPage({ params }: { params: Promise<{ approvalId: string }> }) {
  const { approvalId } = await params;
  return <ApprovalDetailPage approvalId={approvalId} />;
}
