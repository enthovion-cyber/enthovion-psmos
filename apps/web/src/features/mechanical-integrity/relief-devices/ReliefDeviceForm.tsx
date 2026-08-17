'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReliefDeviceDetailResponse } from '../types/relief-device.types';
import { useReliefDeviceMutations } from '../hooks/useReliefDeviceMutations';
import { ProtectedEquipmentSection } from './sections/ProtectedEquipmentSection';
import { ReliefBasisSection } from './sections/ReliefBasisSection';
import { ReliefCertificatesSection } from './sections/ReliefCertificatesSection';
import { ReliefDeviceIdentificationSection } from './sections/ReliefDeviceIdentificationSection';
import { ReliefDeviceLocationSection } from './sections/ReliefDeviceLocationSection';
import { ReliefReviewSaveSection } from './sections/ReliefReviewSaveSection';
import { ReliefSealLockSection } from './sections/ReliefSealLockSection';
import { ReliefTechnicalDataSection } from './sections/ReliefTechnicalDataSection';
import { ReliefTestRequirementSection } from './sections/ReliefTestRequirementSection';

export function ReliefDeviceForm({ initial, equipmentId }: { initial?: ReliefDeviceDetailResponse | undefined; equipmentId?: string | undefined }) {
  const router = useRouter();
  const deviceId = initial?.device?.id;
  const mutations = useReliefDeviceMutations(deviceId);
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    deviceType: 'PSV',
    status: 'Active',
    safetyCritical: true,
    testRequired: true,
    certificateRequired: true,
    schedulerActive: true,
    protectedEquipmentId: equipmentId,
    ...(initial?.device ?? {}),
    ...(initial?.technicalData ?? {}),
    ...(initial?.basis ?? {}),
    ...(initial?.testRequirement ?? {}),
    ...(initial?.seals ?? {})
  }));
  const disabledReason = useMemo(() => !String(values.deviceTag ?? values.device_tag ?? '').trim() ? 'Relief device tag is required.' : null, [values]);
  const onChange = (name: string, value: string | boolean) => setValues((current) => ({ ...current, [name]: value }));
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (disabledReason) return;
    const result = deviceId ? await mutations.update.mutateAsync(values) : await mutations.create.mutateAsync(values);
    const id = result.device?.id ?? deviceId;
    if (id) router.push(`/mechanical-integrity/relief-devices/${id}`);
  };
  const saving = mutations.create.isPending || mutations.update.isPending;
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <ReliefDeviceIdentificationSection values={values} onChange={onChange} />
      <ReliefDeviceLocationSection values={values} onChange={onChange} />
      <ProtectedEquipmentSection values={values} onChange={onChange} />
      <ReliefTechnicalDataSection values={values} onChange={onChange} />
      <ReliefBasisSection values={values} onChange={onChange} />
      <ReliefTestRequirementSection values={values} onChange={onChange} />
      <ReliefSealLockSection values={values} onChange={onChange} />
      <ReliefCertificatesSection certificates={initial?.certificates} />
      <ReliefReviewSaveSection saving={saving} disabledReason={disabledReason} />
    </form>
  );
}
