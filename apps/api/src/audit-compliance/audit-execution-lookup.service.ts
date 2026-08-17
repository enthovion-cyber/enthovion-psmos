import { Injectable } from "@nestjs/common";
import { AuditExecutionService } from "./audit-execution.service";

@Injectable()
export class AuditExecutionLookupService {
  constructor(public readonly execution: AuditExecutionService) {}
}
