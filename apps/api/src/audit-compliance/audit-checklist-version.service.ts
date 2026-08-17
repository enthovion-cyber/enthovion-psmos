import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistVersionService {
  constructor(readonly core: AuditChecklistService) {}
}
