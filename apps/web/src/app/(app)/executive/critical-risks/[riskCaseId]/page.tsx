import {
  ExecutiveCriticalRiskRegisterPage,
  ExecutiveRiskBarriersPage,
  ExecutiveRiskDetailPage,
  ExecutiveRiskHistoryPage,
} from '@/features/executive/critical-risk/ExecutiveCriticalRiskPages';

const filterViews = new Set([
  'register',
  'critical',
  'high-priority',
  'unacknowledged',
  'awaiting-verification',
]);

export default async function Page({ params }: { params: Promise<{ riskCaseId: string }> }) {
  const { riskCaseId } = await params;

  if (riskCaseId === 'barriers') {
    return <ExecutiveRiskBarriersPage />;
  }

  if (riskCaseId === 'history') {
    return <ExecutiveRiskHistoryPage />;
  }

  if (filterViews.has(riskCaseId)) {
    return <ExecutiveCriticalRiskRegisterPage view={riskCaseId === 'register' ? undefined : riskCaseId} />;
  }

  return <ExecutiveRiskDetailPage id={riskCaseId} />;
}
