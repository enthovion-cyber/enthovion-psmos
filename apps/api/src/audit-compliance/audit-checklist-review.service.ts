import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistReviewService {
  constructor(readonly core: AuditChecklistService) {}
}
