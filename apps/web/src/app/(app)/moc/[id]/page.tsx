'use client';

import { useParams } from 'next/navigation';
import { MOCDetailPage } from '@/features/moc/components/MOCDetailPage';

export default function MOCDetailRoute() {
  const params = useParams<{ id: string }>();
  return <MOCDetailPage id={params.id} />;
}
