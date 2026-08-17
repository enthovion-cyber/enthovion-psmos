import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistSettingsService {
  constructor(readonly core: AuditChecklistService) {}
}
