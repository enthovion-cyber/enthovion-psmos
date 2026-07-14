'use client';

import { useMemo, useState } from 'react';
import { Archive, Plus, Save, X } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import type { FoundationEntity, FoundationInput, FoundationKind } from '@/services/foundation.service';
import { useWorkspaceEntityMutations, useWorkspaceReference } from '../hooks/useCompanyWorkspace';
import { WorkspaceEmptyState } from './WorkspaceEmptyState';
import { WorkspaceStatusBadge } from './WorkspaceStatusBadge';

export function WorkspaceEntityManager({ kind, title, description }: { kind: FoundationKind; title: string; description: string }) {
  const [editing, setEditing] = useState<FoundationEntity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FoundationInput>({ name: '', status: 'ACTIVE' });
  const referenceQuery = useWorkspaceReference();
  const mutations = useWorkspaceEntityMutations();
  const toast = useMutationToast();
  const data = referenceQuery.data;
  const rows = data?.[kind] ?? [];
  const isSaving = mutations.create.isPending || mutations.update.isPending || mutations.archive.isPending;
  const relationOptions = useMemo(() => ({ companies: data?.companies ?? [], sites: data?.sites ?? [], departments: data?.departments ?? [], units: data?.units ?? [] }), [data]);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', status: 'ACTIVE' });
    setDrawerOpen(true);
  }

  function openEdit(row: FoundationEntity) {
    setEditing(row);
    setForm({ ...row, name: row.name });
    setDrawerOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (editing) await mutations.update.mutateAsync({ kind, id: editing.id, input: form });
      else await mutations.create.mutateAsync({ kind, input: form });
      toast.success(editing ? `${title} updated` : `${title} created`);
      setDrawerOpen(false);
    } catch (error) {
      toast.error('Save failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  async function archive(row: FoundationEntity) {
    const reason = window.prompt(`Archive ${row.name}? Enter a reason.`);
    if (!reason) return;
    try {
      await mutations.archive.mutateAsync({ kind, id: row.id, reason });
      toast.success(`${title} archived`);
    } catch (error) {
      toast.error('Archive failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <div className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-info">Company Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{description}</p>
          </div>
          <button className="psm-button psm-button-primary" onClick={openCreate} disabled={isSaving} title={isSaving ? 'A workspace mutation is already running' : `Create ${title}`}>
            <Plus size={16} /> Add {title}
          </button>
        </div>
      </section>

      <section className="psm-card overflow-hidden">
        <div className="border-b border-[var(--psm-line)] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">{title} Register</h2>
        </div>
        {referenceQuery.isLoading ? <div className="p-6 text-sm text-[var(--psm-muted)]">Loading workspace records...</div> : null}
        {referenceQuery.isError ? <div className="p-6 text-sm text-danger">Unable to load workspace records.</div> : null}
        {!referenceQuery.isLoading && rows.length === 0 ? <div className="p-5"><WorkspaceEmptyState title={`No ${title.toLowerCase()} yet`} description="Create the first record to complete the company workspace hierarchy." /></div> : null}
        {rows.length ? (
          <div className="overflow-auto">
            <table className="psm-table w-full min-w-[840px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Parent</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-[var(--psm-muted)]">{row.code ?? '-'}</td>
                    <td className="px-4 py-3 text-[var(--psm-muted)]">{row.company?.name ?? row.site?.name ?? row.unit?.name ?? '-'}</td>
                    <td className="px-4 py-3"><WorkspaceStatusBadge status={row.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-sm font-semibold text-info" onClick={() => openEdit(row)}>Edit</button>
                        <button className="text-sm font-semibold text-danger" onClick={() => archive(row)} title="Archive requires a reason"><Archive size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <form onSubmit={save} className="ml-auto flex h-full w-full max-w-xl flex-col bg-[var(--psm-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-5">
              <div><h2 className="text-lg font-semibold">{editing ? 'Edit' : 'Add'} {title}</h2><p className="text-sm text-[var(--psm-muted)]">Changes are saved through the backend and audited.</p></div>
              <button type="button" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[var(--psm-surface-2)]" onClick={() => setDrawerOpen(false)}><X size={16} /></button>
            </div>
            <div className="grid flex-1 gap-4 overflow-auto p-5 sm:grid-cols-2">
              <Field label="Name" required value={String(form.name ?? '')} onChange={(name) => setForm({ ...form, name })} />
              <Field label="Code" value={form.code ?? ''} onChange={(code) => setForm({ ...form, code })} />
              {kind === 'sites' ? <Select label="Company" value={form.companyId ?? ''} options={relationOptions.companies} onChange={(companyId) => setForm({ ...form, companyId })} /> : null}
              {kind === 'departments' || kind === 'units' ? <Select label="Site" value={form.siteId ?? ''} options={relationOptions.sites} onChange={(siteId) => setForm({ ...form, siteId })} /> : null}
              {kind === 'units' ? <Select label="Department" value={form.departmentId ?? ''} options={relationOptions.departments} onChange={(departmentId) => setForm({ ...form, departmentId })} /> : null}
              {kind === 'areas' ? <Select label="Site" value={form.siteId ?? ''} options={relationOptions.sites} onChange={(siteId) => setForm({ ...form, siteId })} /> : null}
              {kind === 'areas' ? <Select label="Process Unit" value={form.unitId ?? ''} options={relationOptions.units} onChange={(unitId) => setForm({ ...form, unitId })} /> : null}
              <Field label="Country" value={form.country ?? ''} onChange={(country) => setForm({ ...form, country })} />
              <Field label="Timezone" value={form.timezone ?? ''} onChange={(timezone) => setForm({ ...form, timezone })} />
              <label className="text-sm sm:col-span-2"><span className="mb-2 block text-[var(--psm-muted)]">Description / Address</span><textarea className="psm-input min-h-24 w-full p-3" value={(kind === 'sites' || kind === 'companies' ? form.address : form.description) ?? ''} onChange={(event) => kind === 'sites' || kind === 'companies' ? setForm({ ...form, address: event.target.value }) : setForm({ ...form, description: event.target.value })} /></label>
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--psm-line)] p-5"><button type="button" className="psm-button psm-button-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="psm-button psm-button-primary" disabled={isSaving} title={isSaving ? 'Saving workspace record' : 'Save changes'}><Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}</button></div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="text-sm"><span className="mb-2 block text-[var(--psm-muted)]">{label}{required ? ' *' : ''}</span><input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="psm-input h-10 w-full px-3" /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: FoundationEntity[]; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-2 block text-[var(--psm-muted)]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="psm-input h-10 w-full px-3"><option value="">Select {label}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
}
