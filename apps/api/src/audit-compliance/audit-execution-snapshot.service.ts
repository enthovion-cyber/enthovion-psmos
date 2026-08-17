import { Injectable } from "@nestjs/common";
import { AuditExecutionService } from "./audit-execution.service";

@Injectable()
export class AuditExecutionSnapshotService {
  constructor(public readonly execution: AuditExecutionService) {}
}
