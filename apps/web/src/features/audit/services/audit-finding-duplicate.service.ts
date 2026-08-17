import { auditFindingService } from "./audit-finding.service";
export const auditFindingDuplicateService = { check: auditFindingService.checkDuplicates };
