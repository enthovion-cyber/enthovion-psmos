import { Injectable } from "@nestjs/common";
import { AuditExecutionService } from "./audit-execution.service";

@Injectable()
export class AuditExecutionUpdateService {
  constructor(public readonly execution: AuditExecutionService) {}
}
