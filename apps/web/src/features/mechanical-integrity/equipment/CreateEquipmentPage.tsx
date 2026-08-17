'use client';

import { useRouter } from 'next/navigation';
import { useEquipmentMutations } from '../hooks/useEquipmentMutations';
import { EquipmentForm, type EquipmentFormState } from './EquipmentForm';

export function CreateEquipmentPage() {
  const router = useRouter();
  const mutations = useEquipmentMutations();
  async function submit(values: EquipmentFormState) {
    const equipment = await mutations.create.mutateAsync(values as any);
    router.push(`/mechanical-integrity/equipment/${equipment.id}`);
  }
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Create Equipment</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">Create the MI equipment foundation record with classification, technical, criticality, schedule, safeguard, and linked-record context.</p>
      </header>
      <EquipmentForm mode="create" saving={mutations.create.isPending} onSubmit={submit} />
    </div>
  );
}
