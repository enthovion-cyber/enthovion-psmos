'use client';

import { useState } from 'react';

export function WebhookEventDetailDrawer({ event }: { event: any }) {
  const [open, setOpen] = useState(false);
  return <>{<button className="psm-button" onClick={() => setOpen(true)}>View</button>}{open ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="psm-panel max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl p-5"><h2 className="text-lg font-semibold">Webhook event</h2><pre className="mt-4 whitespace-pre-wrap rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(event, null, 2)}</pre><button className="psm-button mt-4" onClick={() => setOpen(false)}>Close</button></div></div> : null}</>;
}
