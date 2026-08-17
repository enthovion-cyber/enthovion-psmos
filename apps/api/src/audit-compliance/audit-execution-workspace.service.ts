import { Injectable } from "@nestjs/common";
import { AuditExecutionService } from "./audit-execution.service";

@Injectable()
export class AuditExecutionWorkspaceService {
  constructor(public readonly execution: AuditExecutionService) {}
}
