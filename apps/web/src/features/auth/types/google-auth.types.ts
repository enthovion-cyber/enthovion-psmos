export type GoogleAuthResult = {
  mode?: string;
  email?: string;
  userId?: string;
  company?: Record<string, unknown>;
  url?: string;
  message?: string;
};
