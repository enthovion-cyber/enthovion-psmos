export type SignupEmailInput = {
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  supabaseUserId?: string;
  emailRedirectTo?: string;
  intent?: 'trial' | 'checkout' | 'enterprise';
  planCode?: string;
};

export type SignupSessionStatus = {
  found: boolean;
  sessionId?: string;
  email?: string;
  provider?: 'email' | 'google';
  status: string;
  currentStep: string;
  next?: string;
};

export type CompleteSignupInput = {
  sessionId?: string;
  email: string;
  fullName: string;
  title?: string;
  phone?: string;
  workspaceName: string;
  workspaceSlug: string;
  industry?: string;
  country?: string;
  timezone?: string;
  companySize?: string;
  primarySiteName?: string;
  providerUserId?: string;
  avatarUrl?: string;
  intent?: 'trial' | 'checkout' | 'enterprise';
  planCode?: string;
};

export type SignupAuthResult = {
  status: string;
  sessionId?: string;
  next?: string;
  accessToken?: string;
  refreshToken?: string;
  tenantId?: string;
  companyIds?: string[];
  siteIds?: string[];
  roles?: string[];
};
