'use client';

import { useParams } from 'next/navigation';
import { ScopedIntegrationPage } from '@/features/psi/integrations/ScopedIntegrationPage';

export default function Page() {
  const params = useParams<{ unitId: string }>();
  return <ScopedIntegrationPage title="Unit PSSR PSI Integrations" filters={{ unitId: params.unitId, sourceModule: 'PSSR' }} />;
}
