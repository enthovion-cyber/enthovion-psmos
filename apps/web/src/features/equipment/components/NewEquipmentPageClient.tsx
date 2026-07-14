'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EquipmentForm } from './EquipmentForm';
import { equipmentService, type CreateEquipmentInput } from '@/services/equipment.service';
import { useMutationToast } from '@/providers/ToastProvider';

export function NewEquipmentPageClient() {
  const router = useRouter();
  const toast = useMutationToast();

  async function createEquipment(values: Partial<CreateEquipmentInput>) {
    try {
      const equipment = await equipmentService.create(values as CreateEquipmentInput);
      toast.success('Equipment created', `${equipment.tag} was added to the registry.`);
      router.push('/equipment');
      router.refresh();
    } catch (error) {
      toast.error('Create equipment failed', getErrorMessage(error));
      throw error;
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => router.push('/equipment')} className="psm-button psm-button-secondary">
        <ArrowLeft size={16} /> Back to Equipment List
      </button>
      <EquipmentForm title="New Equipment" submitLabel="Create Equipment" onSave={createEquipment} onCancel={() => router.push('/equipment')} />
    </div>
  );
}

function getErrorMessage(error: unknown) {
  const responseData = typeof error === 'object' && error && 'response' in error
    ? (error as { response?: { data?: unknown } }).response?.data
    : undefined;
  if (typeof responseData === 'object' && responseData && 'message' in responseData) {
    const message = (responseData as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  }
  return error instanceof Error ? error.message : 'The request could not be completed.';
}
