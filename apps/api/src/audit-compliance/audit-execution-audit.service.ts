import { Injectable } from "@nestjs/common";
import { AuditExecutionHistoryService } from "./audit-execution-history.service";

@Injectable()
export class AuditExecutionAuditService {
  constructor(public readonly history: AuditExecutionHistoryService) {}
}
