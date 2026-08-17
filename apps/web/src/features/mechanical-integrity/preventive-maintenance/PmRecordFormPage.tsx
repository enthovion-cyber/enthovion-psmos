'use client';

import { useRouter } from 'next/navigation';
import { usePmMutations } from '../hooks/usePmMutations';
import { PmRecordForm } from './PmRecordForm';

export function PmRecordFormPage() {
  const router = useRouter();
  const mutations = usePmMutations();
  return <PmRecordForm saving={mutations.createRecord.isPending} onSubmit={(input) => mutations.createRecord.mutate(input, { onSuccess: (data) => router.push(`/mechanical-integrity/preventive-maintenance/records/${String((data as any).record?.id ?? '')}`) })} />;
}

