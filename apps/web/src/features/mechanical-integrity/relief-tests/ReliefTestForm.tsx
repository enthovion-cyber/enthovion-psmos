'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReliefTestMutations } from '../hooks/useReliefTestMutations';
import { ReliefAsFoundSection } from './sections/ReliefAsFoundSection';
import { ReliefAsLeftSection } from './sections/ReliefAsLeftSection';
import { ReliefCertificateEvidenceSection } from './sections/ReliefCertificateEvidenceSection';
import { ReliefLeakTestSection } from './sections/ReliefLeakTestSection';
import { ReliefRepairAdjustmentSection } from './sections/ReliefRepairAdjustmentSection';
import { ReliefTestContextSection } from './sections/ReliefTestContextSection';

export function ReliefTestForm({ initial }: { initial?: any }) {
  const router = useRouter();
  const params = useSearchParams();
  const testId = initial?.test?.id;
  const mutations = useReliefTestMutations(testId);
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    testDate: new Date().toISOString().slice(0, 10),
    planned: true,
    reliefDeviceId: params.get('reliefDeviceId') ?? undefined,
    ...(initial?.test ?? {}),
    ...(initial?.result ?? {}),
    ...(initial?.leakTest ?? {})
  }));
  const onChange = (name: string, value: string | boolean) => setValues((current) => ({ ...current, [name]: value }));
  const disabledReason = !String(values.reliefDeviceId ?? values.relief_device_id ?? '').trim() ? 'Relief device is required.' : null;
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (disabledReason) return;
    const result = testId ? await mutations.update.mutateAsync(values) : await mutations.create.mutateAsync(values);
    const id = result.test?.id ?? testId;
    if (id) router.push(`/mechanical-integrity/relief-devices/tests/${id}`);
  };
  const saving = mutations.create.isPending || mutations.update.isPending;
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <ReliefTestContextSection values={values} onChange={onChange} />
      <ReliefAsFoundSection values={values} onChange={onChange} />
      <ReliefRepairAdjustmentSection values={values} onChange={onChange} />
      <ReliefAsLeftSection values={values} onChange={onChange} />
      <ReliefLeakTestSection values={values} onChange={onChange} />
      <ReliefCertificateEvidenceSection values={values} onChange={onChange} />
      {disabledReason ? <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">{disabledReason}</p> : null}
      <button type="submit" disabled={saving || !!disabledReason} className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving...' : 'Save relief test'}</button>
    </form>
  );
}
