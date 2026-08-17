import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistSectionService {
  constructor(readonly core: AuditChecklistService) {}
}
