import {
  ExecutiveEscalationDetailPage,
  ExecutiveEscalationRegisterPage,
  ExecutiveEscalationRulesPage,
} from '@/features/executive/critical-risk/ExecutiveEscalationPages';

const filterViews = new Set([
  'register',
  'active',
  'my-escalations',
  'unacknowledged',
  'overdue',
  'history',
]);

export default async function Page({ params }: { params: Promise<{ escalationId: string }> }) {
  const { escalationId } = await params;

  if (escalationId === 'rules') {
    return <ExecutiveEscalationRulesPage />;
  }

  if (filterViews.has(escalationId)) {
    return <ExecutiveEscalationRegisterPage view={escalationId === 'register' ? undefined : escalationId} />;
  }

  return <ExecutiveEscalationDetailPage id={escalationId} />;
}
