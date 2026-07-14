import { api } from './api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type FoundationEntity = {
  id: string;
  tenantId?: string;
  name: string;
  code?: string | null | undefined;
  companyId?: string | null | undefined;
  siteId?: string | null | undefined;
  unitId?: string | null | undefined;
  departmentId?: string | null | undefined;
  industry?: string | null | undefined;
  country?: string | null | undefined;
  timezone?: string | null | undefined;
  legalName?: string | null | undefined;
  displayName?: string | null | undefined;
  slug?: string | null | undefined;
  currency?: string | null | undefined;
  logoUrl?: string | null | undefined;
  address?: string | null | undefined;
  phone?: string | null | undefined;
  website?: string | null | undefined;
  siteManagerId?: string | null | undefined;
  emergencyContact?: string | null | undefined;
  emergencyContactName?: string | null | undefined;
  emergencyContactPhone?: string | null | undefined;
  emergencyContactEmail?: string | null | undefined;
  domain?: string | null | undefined;
  verificationMethod?: string | null | undefined;
  domainOwnerEmail?: string | null | undefined;
  notes?: string | null | undefined;
  managerId?: string | null | undefined;
  description?: string | null | undefined;
  status?: string | null | undefined;
  onboardingStatus?: string | null | undefined;
  company?: FoundationEntity | null;
  site?: FoundationEntity | null;
  unit?: FoundationEntity | null;
};

export type CompanyDomain = {
  id: string;
  companyId: string;
  domain: string;
  verificationStatus: string;
  verificationMethod: string;
  allowGoogleLogin: boolean;
  allowAutoJoin: boolean;
  domainOwnerEmail?: string | null;
  status: string;
  notes?: string | null;
};

export type CompanySettings = {
  company: FoundationEntity;
  settings: {
    id: string;
    companyId: string;
    defaultTimezone: string;
    defaultCurrency: string;
    dateFormat: string;
    timeFormat: string;
    language: string;
    allowGoogleLogin: boolean;
    allowDomainAutoJoin: boolean;
    requireMfa: boolean;
    requireESignature: boolean;
  };
};

export type FoundationContext = {
  tenantId: string;
  companyIds: string[];
  siteIds: string[];
  activeCompanyId?: string | null;
  activeSiteId?: string | null;
  selectedSiteId?: string | null;
  corporateView: boolean;
  roles?: string[];
  permissions?: string[];
  isSuperAdmin?: boolean;
  isCompanyAdmin?: boolean;
  isSiteAdmin?: boolean;
  companies: FoundationEntity[];
  sites: FoundationEntity[];
};

export type FoundationInput = Partial<FoundationEntity> & Record<string, unknown>;

export const foundationService = {
  async context(): Promise<FoundationContext> {
    return unwrap(await api.get('/auth/me/tenant-context'));
  },
  async workspaces(): Promise<FoundationContext> {
    return unwrap(await api.get('/auth/me/workspaces'));
  },
  async allowedCompanies(): Promise<FoundationEntity[]> {
    return unwrap(await api.get('/auth/me/allowed-companies'));
  },
  async allowedSites(): Promise<FoundationEntity[]> {
    return unwrap(await api.get('/auth/me/allowed-sites'));
  },
  async companies(): Promise<FoundationEntity[]> {
    return unwrap(await api.get('/foundation/companies'));
  },
  async sites(): Promise<FoundationEntity[]> {
    return unwrap(await api.get('/foundation/sites'));
  },
  async departments(): Promise<FoundationEntity[]> {
    return unwrap(await api.get('/foundation/departments'));
  },
  async units(): Promise<FoundationEntity[]> {
    return unwrap(await api.get('/foundation/units'));
  },
  async areas(): Promise<FoundationEntity[]> {
    return unwrap(await api.get('/foundation/areas'));
  },
  async create(kind: FoundationKind, input: FoundationInput): Promise<FoundationEntity> {
    return unwrap(await api.post(`/foundation/${kind}`, input));
  },
  async update(kind: FoundationKind, id: string, input: FoundationInput): Promise<FoundationEntity> {
    return unwrap(await api.patch(`/foundation/${kind}/${id}`, input));
  },
  async archive(kind: FoundationKind, id: string, reason: string): Promise<FoundationEntity> {
    return unwrap(await api.delete(`/foundation/${kind}/${id}`, { data: { reason } }));
  },
  async companySettings(): Promise<CompanySettings> {
    return unwrap(await api.get('/settings/company'));
  },
  async updateCompanySettings(input: FoundationInput): Promise<CompanySettings> {
    return unwrap(await api.patch('/settings/company', input));
  },
  async domains(): Promise<CompanyDomain[]> {
    return unwrap(await api.get('/settings/company/domains'));
  },
  async createDomain(input: FoundationInput): Promise<CompanyDomain> {
    return unwrap(await api.post('/settings/company/domains', input));
  },
  async verifyDomain(domainId: string): Promise<CompanyDomain> {
    return unwrap(await api.post(`/settings/company/domains/${domainId}/verify`));
  },
  async switchCompany(companyId: string): Promise<{ companyId: string; siteId?: string | null }> {
    return unwrap(await api.post('/auth/me/switch-company', { companyId }));
  },
  async switchSite(siteId: string | null): Promise<{ companyId?: string | null; siteId: string | null }> {
    return unwrap(await api.post('/auth/me/switch-site', { siteId }));
  },
  async refreshContext(): Promise<FoundationContext> {
    return unwrap(await api.post('/auth/me/refresh-context'));
  },
  async securityEvents(): Promise<Array<Record<string, unknown>>> {
    return unwrap(await api.get('/auth/me/security-events'));
  },
  async startOnboarding(input: FoundationInput): Promise<FoundationEntity> {
    return unwrap(await api.post('/onboarding/company/start', input));
  },
  async completeOnboarding(input: FoundationInput): Promise<{ company: FoundationEntity }> {
    return unwrap(await api.post('/onboarding/company/complete', input));
  }
};

export type FoundationKind = 'companies' | 'sites' | 'departments' | 'units' | 'areas';
