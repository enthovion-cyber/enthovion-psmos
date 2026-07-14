'use client';

import { useState } from 'react';
import { api } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

export function PlanEntitlementEditor({ planId }: { planId: string }) {
  const queryClient = useQueryClient();
  const [key, setKey] = useState('');
  async function add() {
    if (!key) return window.alert('Entitlement key is required.');
    await api.post(`/platform/billing/plans/${planId}/entitlements`, { entitlement_key: key, entitlement_type: key.startsWith('module.') ? 'module' : 'limit', enabled: true, config_json: {} });
    await queryClient.invalidateQueries({ queryKey: ['platform', 'billing', 'plans'] });
    setKey('');
  }
  return <div className="mt-4 flex gap-2"><input className="psm-input min-w-0 flex-1 px-3" placeholder="module.ptw or limit.seats" value={key} onChange={(event) => setKey(event.target.value)} /><button className="psm-button" onClick={() => void add()}>Add entitlement</button></div>;
}
