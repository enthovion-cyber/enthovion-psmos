import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistAssignmentService {
  constructor(readonly core: AuditChecklistService) {}
}
