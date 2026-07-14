'use client';

import { useState } from 'react';
import { api } from '@/services/api';

export function CompanyBillingAdminDrawer({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  async function save() {
    await api.patch(`/platform/billing/companies/${companyId}/override`, { override_type: 'access_mode', reason, config_json: { access_mode: 'warning' } });
    setOpen(false);
  }
  return <>{<button className="psm-button" onClick={() => setOpen(true)}>Override</button>}{open ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="psm-panel w-full max-w-md rounded-xl p-5"><h2 className="text-lg font-semibold">Company billing override</h2><textarea className="psm-input mt-4 min-h-24 w-full p-3" placeholder="Reason required" value={reason} onChange={(e) => setReason(e.target.value)} /><div className="mt-4 flex justify-end gap-2"><button className="psm-button" onClick={() => setOpen(false)}>Close</button><button className="psm-button psm-button-primary" disabled={!reason.trim()} onClick={() => void save()}>Save override</button></div></div></div> : null}</>;
}
