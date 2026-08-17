import { TrainingApprovalPackageDetailPage } from '@/features/training/review/TrainingApprovalPackageDetailPage';
export default function Page({ params }: { params: { approvalId: string } }) { return <TrainingApprovalPackageDetailPage approvalId={params.approvalId} focus="snapshot" />; }
