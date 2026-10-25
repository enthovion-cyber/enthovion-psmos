import {
  ExecutiveLeadershipAttentionPage,
  ExecutiveLeadershipDecisionsRequiredPage,
  ExecutiveLeadershipUnacknowledgedPage,
} from '@/features/executive/critical-risk/ExecutiveLeadershipAttentionPages';

export default async function Page({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;

  if (view === 'decisions-required') {
    return <ExecutiveLeadershipDecisionsRequiredPage />;
  }

  if (view === 'unacknowledged') {
    return <ExecutiveLeadershipUnacknowledgedPage />;
  }

  return <ExecutiveLeadershipAttentionPage />;
}
