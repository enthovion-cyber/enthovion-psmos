'use client';

import { api } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

export function ReplayWebhookDialog({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  async function replay() {
    await api.post(`/platform/billing/webhook-events/${eventId}/replay`);
    await queryClient.invalidateQueries({ queryKey: ['platform', 'billing', 'webhooks'] });
  }
  return <button className="psm-button" onClick={() => void replay()}>Replay</button>;
}
