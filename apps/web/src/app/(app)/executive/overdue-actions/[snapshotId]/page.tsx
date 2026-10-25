import {
  ExecutiveOverdueActionDetailPage,
  ExecutiveOverdueActionRegisterPage,
  ExecutiveOverdueByModulePage,
  ExecutiveOverdueByOwnerPage,
  ExecutiveOverdueBySitePage,
} from '@/features/executive/critical-risk/ExecutiveOverdueActionPages';

const filterViews = new Set(['register', 'critical', 'repeated']);

export default async function Page({ params }: { params: Promise<{ snapshotId: string }> }) {
  const { snapshotId } = await params;

  if (snapshotId === 'by-owner') {
    return <ExecutiveOverdueByOwnerPage />;
  }

  if (snapshotId === 'by-site') {
    return <ExecutiveOverdueBySitePage />;
  }

  if (snapshotId === 'by-module') {
    return <ExecutiveOverdueByModulePage />;
  }

  if (filterViews.has(snapshotId)) {
    return <ExecutiveOverdueActionRegisterPage view={snapshotId === 'register' ? undefined : snapshotId} />;
  }

  return <ExecutiveOverdueActionDetailPage id={snapshotId} />;
}
