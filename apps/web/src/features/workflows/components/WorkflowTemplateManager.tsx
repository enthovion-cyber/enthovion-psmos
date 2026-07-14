'use client';

import { useMemo, useState } from 'react';
import { Copy, GitBranch, Play, Power, Save, Star, Trash2 } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import type { WorkflowStepInput, WorkflowTemplate, WorkflowTemplateInput } from '@/services/workflows.service';
import { useWorkflowMutations, useWorkflowOverdue, useWorkflowTemplates } from '../hooks/useWorkflows';
import { WorkflowStatusBadge } from './WorkflowBadges';
import { WorkflowStepBuilder } from './WorkflowStepBuilder';

const moduleOptions = ['MOC', 'PTW', 'PSSR', 'DOCUMENTS', 'INCIDENTS', 'AUDITS', 'HAZARD_REPORTING'];

const starterSteps: WorkflowStepInput[] = [
  { stepName: 'Reviewer', stepType: 'Review', sequence: 1, approvalMode: 'Single', slaHours: 24, isRequired: true, canReject: true },
  { stepName: 'Approver', stepType: 'Approval', sequence: 2, approvalMode: 'Single', slaHours: 24, isRequired: true, canReject: true }
];

export function WorkflowTemplateManager() {
  const templatesQuery = useWorkflowTemplates();
  const overdueQuery = useWorkflowOverdue();
  const mutations = useWorkflowMutations();
  const toast = useMutationToast();
  const [selected, setSelected] = useState<WorkflowTemplate | null>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState<WorkflowTemplateInput>({
    module: 'MOC',
    name: '',
    description: '',
    status: 'DRAFT',
    isDefault: false,
    steps: starterSteps
  });

  const templates = templatesQuery.data ?? [];
 const filtered = useMemo(() => {
  // 1. Ensure templates exists and is actually an array
  if (!Array.isArray(templates)) return []; 
  
  // 2. Run your original filtering logic
  return templates.filter((template) => !filter || template.module === filter);
}, [templates, filter]);
  function edit(template: WorkflowTemplate) {
    setSelected(template);
    setForm({
      module: template.module,
      name: template.name,
      description: template.description ?? '',
      companyId: template.company_id ?? undefined,
      siteId: template.site_id ?? undefined,
      status: template.status,
      isDefault: template.is_default,
      steps: template.steps.map((step) => ({
        id: step.id,
        stepName: step.step_name,
        stepType: step.step_type,
        sequence: step.sequence,
        assignedRoleId: step.assigned_role_id ?? undefined,
        assignedUserId: step.assigned_user_id ?? undefined,
        assignedDepartmentId: step.assigned_department_id ?? undefined,
        approvalMode: step.approval_mode,
        parallelGroup: step.parallel_group ?? undefined,
        conditionRule: step.condition_rule ?? undefined,
        slaHours: step.sla_hours ?? undefined,
        isRequired: step.is_required,
        canReject: step.can_reject,
        canOverride: step.can_override
      }))
    });
  }

  function reset() {
    setSelected(null);
    setForm({ module: 'MOC', name: '', description: '', status: 'DRAFT', isDefault: false, steps: starterSteps });
  }

  async function run(work: () => Promise<unknown>, title: string) {
    try {
      await work();
      toast.success(title);
      await templatesQuery.refetch();
    } catch (error) {
      toast.error('Workflow request failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      if (selected) await mutations.updateTemplate.mutateAsync({ id: selected.id, input: form });
      else {
        const created = await mutations.createTemplate.mutateAsync(form);
        setSelected(created);
      }
    }, selected ? 'Workflow template updated' : 'Workflow template created');
  }

  return (
    <div className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><GitBranch size={14} /> Reusable Approval Engine</div>
            <h1 className="text-2xl font-semibold">Workflow Engine</h1>
            <p className="mt-1 max-w-3xl text-sm text-[var(--psm-muted)]">Create site-aware workflow templates with approval chains, conditional routing, parallel reviews, SLA timers, escalations, and emergency override.</p>
          </div>
         <div className="grid gap-3 sm:grid-cols-3">
  {/* 1. Added ?. to safely read length if templates is null/undefined */}
  <Metric label="Templates" value={String(templates?.length ?? 0)} />
  
  {/* 2. Added Array.isArray check to ensure filter doesn't blow up */}
  <Metric 
    label="Active" 
    value={String(
      Array.isArray(templates) 
        ? templates.filter((template) => template.status === 'ACTIVE').length 
        : 0
    )} 
  />
  
  <Metric label="Overdue Steps" value={String(overdueQuery.data?.length ?? 0)} danger />
</div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_540px]">
        <section className="psm-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[var(--psm-line)] p-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide">Workflow Template Register</h2>
            <div className="flex gap-2">
              <select value={filter} onChange={(event) => setFilter(event.target.value)} className="psm-input h-10 px-3 text-sm">
                <option value="">All modules</option>
                {moduleOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <button type="button" onClick={reset} className="psm-button psm-button-primary h-10">New Template</button>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="psm-table w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 bg-[var(--psm-surface)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
                <tr>
                  <th className="px-4 py-3">Template</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Steps</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Default</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((template) => (
                  <tr key={template.id} className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]">
                    <td className="px-4 py-3"><button type="button" onClick={() => edit(template)} className="text-left font-semibold text-primary">{template.name}</button><div className="text-xs text-[var(--psm-muted)]">{template.description ?? 'No description'}</div></td>
                    <td className="px-4 py-3">{template.module}</td>
                    <td className="px-4 py-3">{template.steps.length}</td>
                    <td className="px-4 py-3"><WorkflowStatusBadge status={template.status} /></td>
                    <td className="px-4 py-3">{template.is_default ? <span className="psm-badge psm-badge-info">Default</span> : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <IconButton title="Clone" onClick={() => run(() => mutations.cloneTemplate.mutateAsync(template.id), 'Template cloned')} icon={<Copy size={15} />} />
                        <IconButton title={template.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} onClick={() => run(() => template.status === 'ACTIVE' ? mutations.deactivateTemplate.mutateAsync(template.id) : mutations.activateTemplate.mutateAsync(template.id), 'Template status updated')} icon={<Power size={15} />} />
                        <IconButton title="Set default" onClick={() => run(() => mutations.setDefault.mutateAsync(template.id), 'Default workflow updated')} icon={<Star size={15} />} />
                        <IconButton title="Delete" danger onClick={() => window.confirm('Delete this unused workflow template? This cannot be undone.') && void run(() => mutations.deleteTemplate.mutateAsync(template.id), 'Template deleted')} icon={<Trash2 size={15} />} />
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length ? <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--psm-muted)]">{templatesQuery.isLoading ? 'Loading templates...' : 'No workflow templates found.'}</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <form onSubmit={submit} className="psm-card max-h-[calc(100vh-7rem)] overflow-auto p-5">
          <div className="sticky top-0 z-10 -mx-5 -mt-5 border-b border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
            <h2 className="text-lg font-semibold">{selected ? 'Edit Template' : 'Create Template'}</h2>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">No module approval logic should be hardcoded. Configure routing here.</p>
          </div>
          <div className="mt-5 grid gap-3">
            <label className="text-sm"><span className="mb-1.5 block text-[var(--psm-muted)]">Module *</span><select required value={form.module} onChange={(event) => setForm({ ...form, module: event.target.value })} className="psm-input h-10 w-full px-3">{moduleOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <Field label="Template name" required value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <label className="text-sm"><span className="mb-1.5 block text-[var(--psm-muted)]">Description</span><textarea value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} className="psm-input min-h-20 w-full p-3" /></label>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Company ID" value={form.companyId ?? ''} onChange={(companyId) => setForm({ ...form, companyId: companyId || undefined })} />
              <Field label="Site ID" value={form.siteId ?? ''} onChange={(siteId) => setForm({ ...form, siteId: siteId || undefined })} />
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm"><input type="checkbox" checked={form.status === 'ACTIVE'} onChange={(event) => setForm({ ...form, status: event.target.checked ? 'ACTIVE' : 'DRAFT' })} /> Active</label>
              <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm"><input type="checkbox" checked={form.isDefault ?? false} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} /> Default for module</label>
            </div>
            <WorkflowStepBuilder steps={form.steps} onChange={(steps) => setForm({ ...form, steps })} />
            <button className="psm-button psm-button-primary mt-2 w-full" disabled={mutations.createTemplate.isPending || mutations.updateTemplate.isPending}><Save size={16} /> Save Workflow Template</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">{label}</div><div className={`mt-2 text-2xl font-semibold ${danger ? 'text-danger' : ''}`}>{value}</div></div>;
}

function Field({ label, value, onChange, required }: { label: string; value: string; required?: boolean; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1.5 block text-[var(--psm-muted)]">{label}{required ? ' *' : ''}</span><input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="psm-input h-10 w-full px-3" /></label>;
}

function IconButton({ title, icon, onClick, danger }: { title: string; icon: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return <button type="button" title={title} onClick={onClick} className={`rounded-lg border border-[var(--psm-line)] p-2 ${danger ? 'text-danger hover:bg-danger/10' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)]'}`}>{icon}</button>;
}
