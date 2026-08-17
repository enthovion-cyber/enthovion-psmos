'use client';

import { useParams } from 'next/navigation';
import { RequiredTrainingFilteredPage } from '@/features/training/required/RequiredTrainingFilteredPage';

export default function Page() {
  const params = useParams<{ unitId: string }>();
  return <RequiredTrainingFilteredPage view="unit" id={params.unitId} />;
}
