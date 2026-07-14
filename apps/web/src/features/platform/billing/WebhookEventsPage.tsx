'use client';

import { api } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { ReplayWebhookDialog } from './ReplayWebhookDialog';
import { WebhookEventDetailDrawer } from './WebhookEventDetailDrawer';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export function WebhookEventsPage() {
  const query = useQuery({ queryKey: ['platform', 'billing', 'webhooks'], queryFn: () => api.get('/platform/billing/webhook-events').then(unwrap<any[]>) });
  return <section className="space-y-5 p-4 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-info">Platform billing</p><h1 className="text-2xl font-semibold">Webhook events</h1></div><div className="psm-panel overflow-hidden rounded-xl"><table className="w-full text-sm"><thead className="bg-[var(--psm-surface-2)] text-left"><tr><th className="p-3">Event</th><th className="p-3">Status</th><th className="p-3">Provider</th><th className="p-3">Actions</th></tr></thead><tbody>{(query.data ?? []).map((event) => <tr key={event.id} className="border-t border-[var(--psm-line)]"><td className="p-3">{event.event_type}</td><td className="p-3">{event.status}</td><td className="p-3">{event.provider}</td><td className="p-3 flex gap-2"><WebhookEventDetailDrawer event={event} /><ReplayWebhookDialog eventId={event.id} /></td></tr>)}</tbody></table></div></section>;
}
