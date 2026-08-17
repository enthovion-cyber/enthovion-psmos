import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistReadinessService {
  constructor(readonly core: AuditChecklistService) {}
}
