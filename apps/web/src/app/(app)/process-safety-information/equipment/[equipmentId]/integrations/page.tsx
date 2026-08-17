'use client';

import { useParams } from 'next/navigation';
import { ScopedIntegrationPage } from '@/features/psi/integrations/ScopedIntegrationPage';

export default function Page() {
  const params = useParams<{ equipmentId: string }>();
  return <ScopedIntegrationPage title="Equipment PSI Integrations" filters={{ equipmentId: params.equipmentId }} />;
}
