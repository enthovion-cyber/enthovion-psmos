export type InvitationSummary = {
  id: string;
  email: string;
  status: string;
  expiresAt?: string | null;
  companyId?: string | null;
  siteId?: string | null;
  roleId?: string | null;
  expired?: boolean;
  tokenValid?: boolean;
};
