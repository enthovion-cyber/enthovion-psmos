'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useEquipmentList } from '@/features/equipment/hooks/useEquipment';
import { useMutationToast } from '@/providers/ToastProvider';
import type { CreateActionInput } from '@/services/actions.service';
import type { IamUser } from '@/services/iam.service';
import { useActionMutations } from '../hooks/useActions';

const blank = {
  title: '',
  description: '',
  sourceModule: 'Manual',
  sourceRecordId: 'MANUAL',
  priority: 'MEDIUM',
  ownerId: '',
  dueDate: '',
  evidenceRequired: false,
  verificationRequired: false
} as CreateActionInput;

export function ActionCreateModal({ users, onClose }: { users: IamUser[]; onClose: () => void }) {
  const [form, setForm] = useState<CreateActionInput>(blank);
  const equipmentQuery = useEquipmentList();
  const mutations = useActionMutations();
  const toast = useMutationToast();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await mutations.create.mutateAsync(form);
      toast.success('Action created');
      onClose();
    } catch (error) {
      toast.error('Action create failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="psm-card max-h-[90vh] w-full max-w-3xl overflow-auto p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Create Action</h2>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">Universal Action Engine record with assignment, evidence, verification, and audit trail.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-[var(--psm-surface-3)]"><X size={18} /></button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field required label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
          <label className="text-sm">
            <span className="mb-2 block text-[var(--psm-muted)]">Owner *</span>
            <select required className="psm-input w-full px-3" value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })}>
              <option value="">Select owner</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-2 block text-[var(--psm-muted)]">Linked Equipment</span>
            <select
              className="psm-input w-full px-3"
              value={form.equipmentId ?? ''}
              onChange={(event) => {
                const equipment = (equipmentQuery.data ?? []).find((item) => item.id === event.target.value);
                const { equipmentId, siteId, ...rest } = form;
                setForm(equipment ? {
                  ...rest,
                  equipmentId: equipment.id,
                  siteId: equipment.siteId,
                  sourceModule: 'Equipment',
                  sourceType: 'Equipment',
                  sourceRecordId: equipment.id
                } : {
                  ...rest,
                  sourceModule: 'Manual',
                  sourceType: 'Manual',
                  sourceRecordId: 'MANUAL'
                });
              }}
            >
              <option value="">No equipment link</option>
              {(equipmentQuery.data ?? []).map((equipment) => (
                <option key={equipment.id} value={equipment.id}>{equipment.tag} - {equipment.name}</option>
              ))}
            </select>
          </label>
          <Field required label="Source Module" value={form.sourceModule} onChange={(sourceModule) => setForm({ ...form, sourceModule })} />
          <Field required label="Source Record" value={form.sourceRecordId} onChange={(sourceRecordId) => setForm({ ...form, sourceRecordId })} />
          <label className="text-sm">
            <span className="mb-2 block text-[var(--psm-muted)]">Priority *</span>
            <select className="psm-input w-full px-3" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as CreateActionInput['priority'], evidenceRequired: event.target.value === 'SAFETY_CRITICAL' ? true : Boolean(form.evidenceRequired), verificationRequired: event.target.value === 'SAFETY_CRITICAL' ? true : Boolean(form.verificationRequired) })}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="SAFETY_CRITICAL">Safety Critical</option>
            </select>
          </label>
          <Field required label="Due Date" type="date" value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
          <label className="text-sm md:col-span-2">
            <span className="mb-2 block text-[var(--psm-muted)]">Description *</span>
            <textarea required className="psm-input min-h-28 w-full p-3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.evidenceRequired} onChange={(event) => setForm({ ...form, evidenceRequired: event.target.checked })} /> Evidence required</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.verificationRequired} onChange={(event) => setForm({ ...form, verificationRequired: event.target.checked })} /> Verification required</label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="psm-button psm-button-secondary" onClick={onClose}>Cancel</button>
          <button className="psm-button psm-button-primary" disabled={mutations.create.isPending}>Create Action</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="text-sm">
      <span className="mb-2 block text-[var(--psm-muted)]">{label}{required ? ' *' : ''}</span>
      <input required={required} type={type} className="psm-input w-full px-3" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
