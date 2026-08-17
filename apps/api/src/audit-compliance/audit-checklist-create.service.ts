import { Injectable } from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistCreateService {
  constructor(private readonly core: AuditChecklistService) {}
  create(user: RequestUser, dto: Record<string, any>) {
    return this.core.create(user, dto);
  }
}
