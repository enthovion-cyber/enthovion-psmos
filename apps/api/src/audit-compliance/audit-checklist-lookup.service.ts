import { Injectable } from "@nestjs/common";
import { AuditChecklistService } from "./audit-checklist.service";
@Injectable()
export class AuditChecklistLookupService {
  constructor(private readonly core: AuditChecklistService) {}
  all() {
    return this.core.lookups();
  }
}
