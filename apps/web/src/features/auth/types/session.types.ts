export type AuthSessionState = {
  authenticated: boolean;
  next?: string;
  state?: {
    session_version?: number;
    permission_version?: number;
    force_logout?: boolean;
    force_logout_reason?: string | null;
    stale_reason?: string | null;
  } | null;
};
