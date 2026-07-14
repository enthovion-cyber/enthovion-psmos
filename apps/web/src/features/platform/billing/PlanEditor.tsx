'use client';

import { useState } from 'react';
import { api } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';
import { validatePlatformPlan } from '@/features/billing/schemas/platform-plan.schema';

export function PlanEditor() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', code: '', plan_type: 'custom', description: '' });
  async function save() {
    const errors = validatePlatformPlan(form);
    if (errors.length) return window.alert(errors.join(' '));
    await api.post('/platform/billing/plans', { ...form, status: 'active', public_visible: true, sort_order: 100 });
    await queryClient.invalidateQueries({ queryKey: ['platform', 'billing', 'plans'] });
    setForm({ name: '', code: '', plan_type: 'custom', description: '' });
  }
  return <div className="psm-panel rounded-xl p-5"><h2 className="text-lg font-semibold">Create plan</h2><div className="mt-4 grid gap-3 md:grid-cols-4"><input className="psm-input px-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input className="psm-input px-3" placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /><select className="psm-input px-3" value={form.plan_type} onChange={(e) => setForm({ ...form, plan_type: e.target.value })}><option>trial</option><option>starter</option><option>pro</option><option>enterprise</option><option>custom</option></select><button className="psm-button psm-button-primary" onClick={() => void save()}>Create</button></div></div>;
}
