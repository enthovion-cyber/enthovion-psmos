import { Injectable } from "@nestjs/common";
import { AuditExecutionService } from "./audit-execution.service";

@Injectable()
export class AuditFieldNoteService {
  constructor(public readonly execution: AuditExecutionService) {}
}
