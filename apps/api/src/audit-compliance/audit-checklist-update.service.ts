import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistUpdateService {
  constructor(readonly core: AuditChecklistService) {}
}
