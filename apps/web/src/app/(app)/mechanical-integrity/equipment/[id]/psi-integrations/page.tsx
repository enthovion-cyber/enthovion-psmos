'use client';

import { useParams } from 'next/navigation';
import { ScopedIntegrationPage } from '@/features/psi/integrations/ScopedIntegrationPage';

export default function Page() {
  const params = useParams<{ id: string }>();
  return <ScopedIntegrationPage title="MI Equipment PSI Readiness" filters={{ equipmentId: params.id, sourceModule: 'Mechanical Integrity' }} />;
}
