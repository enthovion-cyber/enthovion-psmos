'use client';

import { useMemo, useState } from 'react';
import { Building2, Factory, Layers3, MapPinned, Plus, Save, Users } from 'lucide-react';
import { useFoundationMutations, useFoundationReference } from '@/hooks/useFoundation';
import type { FoundationEntity, FoundationInput, FoundationKind } from '@/services/foundation.service';
import { useMutationToast } from '@/providers/ToastProvider';

const tabs: Array<{ key: FoundationKind; label: string; icon: typeof Building2 }> = [
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'sites', label: 'Sites / Plants', icon: Factory },
  { key: 'departments', label: 'Departments', icon: Users },
  { key: 'units', label: 'Process Units', icon: Layers3 },
  { key: 'areas', label: 'Areas', icon: MapPinned }
];

export function FoundationManagement() {
  const [active, setActive] = useState<FoundationKind>('companies');
  const [editing, setEditing] = useState<FoundationEntity | null>(null);
  const [form, setForm] = useState<FoundationInput>({ name: '' });
  const referenceQuery = useFoundationReference();
  const mutations = useFoundationMutations();
  const toast = useMutationToast();
  const data = referenceQuery.data;
  const rows = data?.[active] ?? [];

  const relationOptions = useMemo(() => ({
    companies: data?.companies ?? [],
    sites: data?.sites ?? [],
    units: data?.units ?? []
  }), [data]);

  function startNew() {
    setEditing(null);
    setForm({ name: '', status: 'ACTIVE' });
  }

  function startEdit(row: FoundationEntity) {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code ?? undefined,
      companyId: row.companyId ?? undefined,
      siteId: row.siteId ?? undefined,
      unitId: row.unitId ?? undefined,
      industry: row.industry ?? undefined,
      country: row.country ?? undefined,
      timezone: row.timezone ?? undefined,
      address: row.address ?? undefined,
      emergencyContact: row.emergencyContact ?? undefined,
      description: row.description ?? undefined,
      status: row.status ?? undefined
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (editing) await mutations.update.mutateAsync({ kind: active, id: editing.id, input: form });
      else await mutations.create.mutateAsync({ kind: active, input: form });
      toast.success(editing ? 'Foundation record updated' : 'Foundation record created');
      startNew();
    } catch (error) {
      toast.error('Save failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <div className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Foundation Architecture</h1>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">Manage company, plant, department, unit, and area hierarchy used for data isolation.</p>
          </div>
          <button type="button" onClick={startNew} className="psm-button psm-button-primary"><Plus size={16} /> New {tabs.find((tab) => tab.key === active)?.label}</button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} type="button" onClick={() => { setActive(tab.key); setEditing(null); setForm({ name: '', status: 'ACTIVE' }); }} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${active === tab.key ? 'border-info bg-info/10 text-info' : 'border-[var(--psm-line)] text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="psm-card overflow-hidden">
          <div className="border-b border-[var(--psm-line)] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide">{tabs.find((tab) => tab.key === active)?.label} Register</h2>
          </div>
          <div className="overflow-auto">
            <table className="psm-table w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-[var(--psm-muted)]">{row.code ?? '-'}</td>
                    <td className="px-4 py-3 text-[var(--psm-muted)]">{row.company?.name ?? row.site?.name ?? row.unit?.name ?? '-'}</td>
                    <td className="px-4 py-3"><span className="rounded-md border border-success/30 bg-success/10 px-2 py-1 text-xs font-semibold text-success">{row.status ?? 'ACTIVE'}</span></td>
                    <td className="px-4 py-3"><button type="button" onClick={() => startEdit(row)} className="text-sm font-semibold text-info">Edit</button></td>
                  </tr>
                ))}
                {!rows.length ? <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--psm-muted)]">No records yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <form onSubmit={submit} className="psm-card p-5">
          <h2 className="text-lg font-semibold">{editing ? 'Edit' : 'Create'} {tabs.find((tab) => tab.key === active)?.label}</h2>
          <div className="mt-5 grid gap-3">
            <Field label="Name" required value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <Field label="Code" value={form.code ?? ''} onChange={(code) => setForm({ ...form, code })} />
            {active === 'sites' ? <Select label="Company" value={form.companyId ?? ''} options={relationOptions.companies} onChange={(companyId) => setForm({ ...form, companyId })} /> : null}
            {active === 'departments' || active === 'units' ? <Select label="Site" value={form.siteId ?? ''} options={relationOptions.sites} onChange={(siteId) => setForm({ ...form, siteId })} /> : null}
            {active === 'areas' ? <Select label="Process Unit" value={form.unitId ?? ''} options={relationOptions.units} onChange={(unitId) => setForm({ ...form, unitId })} /> : null}
            {active === 'companies' ? <Field label="Industry" value={form.industry ?? ''} onChange={(industry) => setForm({ ...form, industry })} /> : null}
            {active === 'companies' || active === 'sites' ? <Field label="Country" value={form.country ?? ''} onChange={(country) => setForm({ ...form, country })} /> : null}
            {active === 'companies' || active === 'sites' ? <Field label="Timezone" value={form.timezone ?? ''} onChange={(timezone) => setForm({ ...form, timezone })} /> : null}
            {active === 'sites' ? <Field label="Emergency Contact" value={form.emergencyContact ?? ''} onChange={(emergencyContact) => setForm({ ...form, emergencyContact })} /> : null}
            <label className="text-sm">
              <span className="mb-2 block text-[var(--psm-muted)]">Description / Address</span>
              <textarea className="psm-input min-h-24 w-full p-3" value={(active === 'companies' || active === 'sites' ? form.address : form.description) ?? ''} onChange={(event) => active === 'companies' || active === 'sites' ? setForm({ ...form, address: event.target.value }) : setForm({ ...form, description: event.target.value })} />
            </label>
          </div>
          <button className="psm-button psm-button-primary mt-5 w-full" disabled={mutations.create.isPending || mutations.update.isPending}><Save size={16} /> Save</button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="text-sm">
      <span className="mb-2 block text-[var(--psm-muted)]">{label}{required ? ' *' : ''}</span>
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="psm-input h-10 w-full px-3" />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: FoundationEntity[]; onChange: (value: string) => void }) {
  return (
    <label className="text-sm">
      <span className="mb-2 block text-[var(--psm-muted)]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="psm-input h-10 w-full px-3">
        <option value="">Select {label}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </label>
  );
}
