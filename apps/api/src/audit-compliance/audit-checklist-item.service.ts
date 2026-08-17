import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistItemService {
  constructor(readonly core: AuditChecklistService) {}
}
