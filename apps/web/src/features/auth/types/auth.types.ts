export type AuthLoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type AuthLoginResult = {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  companyIds: string[];
  siteIds: string[];
  roles: string[];
  sessionVersion: number;
  permissionVersion: number;
  requiresPasswordChange?: boolean;
  next?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  status: string;
};
