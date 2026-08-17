import { Injectable } from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";

@Injectable()
export class AuditExecutionTenantScopeService {
  company(user: RequestUser) {
    return user.tenantId;
  }
}
