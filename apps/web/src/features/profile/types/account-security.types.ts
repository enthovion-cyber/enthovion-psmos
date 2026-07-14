export type ProfileSecurityResponse = {
  loginMethod: {
    passwordEnabled: boolean;
    googleConnected: boolean;
    ssoOnly: boolean;
  };
  connectedAccounts: Array<{ provider: string; email?: string; connectedAt?: string }>;
  activeSessions: Array<{ id?: string; current?: boolean; createdAt?: string; lastSeenAt?: string; ipAddress?: string; userAgent?: string }>;
  securityEvents: Array<{ id?: string; action?: string; eventType?: string; createdAt?: string; created_at?: string; metadata?: unknown }>;
  user: any;
};

export type ProfileSessionsResponse = {
  currentSession?: { userId: string; tenantId: string; current: boolean };
  sessions: Array<{ id?: string; current?: boolean; createdAt?: string; lastSeenAt?: string; ipAddress?: string; userAgent?: string }>;
};

export type ProfileNotificationPreferences = {
  email?: boolean;
  inApp?: boolean;
  modules?: Record<string, unknown>;
  quietHours?: unknown;
};

export type DangerZoneRequest = {
  id: string;
  request_type: string;
  status: string;
  reason?: string | null;
  created_at?: string;
};
