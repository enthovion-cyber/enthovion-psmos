'use client';

import { useParams } from 'next/navigation';
import { RequiredTrainingFilteredPage } from '@/features/training/required/RequiredTrainingFilteredPage';

export default function Page() {
  const params = useParams<{ areaId: string }>();
  return <RequiredTrainingFilteredPage view="area" id={params.areaId} />;
}
