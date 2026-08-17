import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistStandardService {
  constructor(readonly core: AuditChecklistService) {}
}
