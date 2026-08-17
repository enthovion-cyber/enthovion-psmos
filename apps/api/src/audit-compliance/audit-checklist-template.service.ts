import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistTemplateService {
  constructor(readonly core: AuditChecklistService) {}
}
