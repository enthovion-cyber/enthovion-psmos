'use client';

import { useParams } from 'next/navigation';
import { RequiredTrainingFilteredPage } from '@/features/training/required/RequiredTrainingFilteredPage';

export default function Page() {
  const params = useParams<{ siteId: string }>();
  return <RequiredTrainingFilteredPage view="site" id={params.siteId} />;
}
