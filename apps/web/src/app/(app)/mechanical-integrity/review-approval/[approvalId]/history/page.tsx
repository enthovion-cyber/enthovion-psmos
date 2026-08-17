import { ApprovalDetailPage } from '@/features/mechanical-integrity/review-approval/ApprovalDetailPage';

export default async function MechanicalIntegrityApprovalHistoryPage({ params }: { params: Promise<{ approvalId: string }> }) {
  const { approvalId } = await params;
  return <ApprovalDetailPage approvalId={approvalId} />;
}
