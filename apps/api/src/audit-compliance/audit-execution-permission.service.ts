import { ForbiddenException, Injectable } from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";

@Injectable()
export class AuditExecutionPermissionService {
  assertSite(user: RequestUser, siteId?: string | null) {
    if (!siteId || user.isSuperAdmin || user.isCompanyAdmin || user.corporateView) return;
    if (!user.siteIds.includes(siteId)) throw new ForbiddenException("Audit execution site is outside your site access.");
  }
}
