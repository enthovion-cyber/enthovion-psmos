import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistScopeService {
  constructor(readonly core: AuditChecklistService) {}
}
