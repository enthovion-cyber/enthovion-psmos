'use client';

import { useRouter } from 'next/navigation';
import { useCalibrationMutations } from '../hooks/useCalibrationMutations';
import { CalibrationRecordForm } from './CalibrationRecordForm';

export function CalibrationRecordFormPage() {
  const router = useRouter();
  const mutations = useCalibrationMutations();
  return <CalibrationRecordForm saving={mutations.createRecord.isPending} onSubmit={(input) => mutations.createRecord.mutate(input, { onSuccess: (data) => router.push(`/mechanical-integrity/calibration/records/${String((data as any).record?.id ?? '')}`) })} />;
}

