import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistReorderService {
  constructor(readonly core: AuditChecklistService) {}
}
