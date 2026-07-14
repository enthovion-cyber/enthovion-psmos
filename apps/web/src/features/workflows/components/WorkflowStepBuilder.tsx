'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { WorkflowStepInput } from '@/services/workflows.service';

const stepTypes = ['Approval', 'Review', 'Signoff', 'Task', 'System Check'];
const modes = ['Single', 'All', 'Any'];

export function WorkflowStepBuilder({ steps, onChange }: { steps: WorkflowStepInput[]; onChange: (steps: WorkflowStepInput[]) => void }) {
  function update(index: number, patch: Partial<WorkflowStepInput>) {
    onChange(steps.map((step, itemIndex) => itemIndex === index ? { ...step, ...patch } : step));
  }

  function add() {
    onChange([...steps, { stepName: 'New approval step', stepType: 'Approval', sequence: steps.length + 1, approvalMode: 'Single', isRequired: true, canReject: true, canOverride: false }]);
  }

  function remove(index: number) {
    onChange(steps.filter((_, itemIndex) => itemIndex !== index).map((step, itemIndex) => ({ ...step, sequence: itemIndex + 1 })));
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...steps];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const current = next[index];
    const swap = next[target];
    if (!current || !swap) return;
    next[index] = swap;
    next[target] = current;
    onChange(next.map((step, itemIndex) => ({ ...step, sequence: itemIndex + 1 })));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Step Builder</h3>
        <button type="button" onClick={add} className="psm-button psm-button-secondary h-9"><Plus size={15} /> Add Step</button>
      </div>
      {steps.map((step, index) => (
        <div key={`${step.id ?? 'step'}-${index}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">{step.sequence}</div>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(index, -1)} className="rounded-lg p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)]"><ArrowUp size={15} /></button>
              <button type="button" onClick={() => move(index, 1)} className="rounded-lg p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)]"><ArrowDown size={15} /></button>
              <button type="button" onClick={() => remove(index)} className="rounded-lg p-2 text-danger hover:bg-danger/10"><Trash2 size={15} /></button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Step name" value={step.stepName} onChange={(value) => update(index, { stepName: value })} />
            <Select label="Step type" value={step.stepType ?? 'Approval'} options={stepTypes} onChange={(value) => update(index, { stepType: value })} />
            <Select label="Approval mode" value={step.approvalMode ?? 'Single'} options={modes} onChange={(value) => update(index, { approvalMode: value })} />
            <Field label="Parallel group" value={step.parallelGroup ?? ''} onChange={(value) => update(index, { parallelGroup: value || undefined })} />
            <Field label="Assigned role ID" value={step.assignedRoleId ?? ''} onChange={(value) => update(index, { assignedRoleId: value || undefined })} />
            <Field label="Assigned user ID" value={step.assignedUserId ?? ''} onChange={(value) => update(index, { assignedUserId: value || undefined })} />
            <Field label="Assigned department ID" value={step.assignedDepartmentId ?? ''} onChange={(value) => update(index, { assignedDepartmentId: value || undefined })} />
            <Field label="SLA hours" type="number" value={String(step.slaHours ?? '')} onChange={(value) => update(index, { slaHours: value ? Number(value) : undefined })} />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <Field label="Condition JSON" value={step.conditionRule ? JSON.stringify(step.conditionRule) : ''} onChange={(value) => {
              try { update(index, { conditionRule: value ? JSON.parse(value) : undefined }); } catch { update(index, { conditionRule: step.conditionRule }); }
            }} />
            <Toggle label="Required" checked={step.isRequired ?? true} onChange={(checked) => update(index, { isRequired: checked })} />
            <Toggle label="Can reject" checked={step.canReject ?? true} onChange={(checked) => update(index, { canReject: checked })} />
            <Toggle label="Override" checked={step.canOverride ?? false} onChange={(checked) => update(index, { canOverride: checked })} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1.5 block text-[var(--psm-muted)]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="psm-input h-10 w-full px-3" /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1.5 block text-[var(--psm-muted)]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="psm-input h-10 w-full px-3">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 self-end rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> {label}</label>;
}
