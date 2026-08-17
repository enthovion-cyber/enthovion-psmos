import { Injectable } from "@nestjs/common";
import { AuditExecutionService } from "./audit-execution.service";

@Injectable()
export class AuditFieldFindingValidationService {
  constructor(public readonly execution: AuditExecutionService) {}
}
