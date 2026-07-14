import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type RequestUser = {
  id: string;
  tenantId: string;
  companyIds: string[];
  siteIds: string[];
  activeCompanyId?: string | null | undefined;
  activeSiteId?: string | null | undefined;
  selectedSiteId?: string | null | undefined;
  corporateView?: boolean | undefined;
  isSuperAdmin?: boolean | undefined;
  isCompanyAdmin?: boolean | undefined;
  isSiteAdmin?: boolean | undefined;
  tenantContext?: Record<string, unknown> | undefined;
  roles: string[];
  permissions: string[];
};

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): RequestUser => {
  const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
  return request.user;
});
