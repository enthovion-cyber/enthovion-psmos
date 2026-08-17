import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistModuleService {
  constructor(readonly core: AuditChecklistService) {}
}
