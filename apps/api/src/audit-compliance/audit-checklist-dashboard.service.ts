import { Injectable } from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistDashboardService {
  constructor(private readonly core: AuditChecklistService) {}
  dashboard(user: RequestUser, query: Record<string, any> = {}) {
    return this.core.dashboard(user, query);
  }
}
