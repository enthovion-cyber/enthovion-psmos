import { ForbiddenException, Injectable } from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
@Injectable()
export class AuditChecklistTenantScopeService {
  site(user: RequestUser, id: string) {
    if (
      !user.corporateView &&
      !user.isCompanyAdmin &&
      !user.siteIds.includes(id)
    )
      throw new ForbiddenException("Site is outside your access.");
  }
}
