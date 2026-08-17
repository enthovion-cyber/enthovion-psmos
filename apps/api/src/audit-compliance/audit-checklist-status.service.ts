import { Injectable } from "@nestjs/common";
@Injectable()
export class AuditChecklistStatusService {
  readonly locked = ["Approved", "Active", "Current", "Superseded", "Archived"];
}
