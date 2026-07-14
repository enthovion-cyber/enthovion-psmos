export type AuthSecurityEvent = {
  id: string;
  eventType?: string;
  event_type?: string;
  description?: string | null;
  success?: boolean;
  failure_reason?: string | null;
  createdAt?: string;
  created_at?: string;
};
