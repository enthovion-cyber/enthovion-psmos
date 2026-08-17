import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistQuestionBankService {
  constructor(readonly core: AuditChecklistService) {}
}
