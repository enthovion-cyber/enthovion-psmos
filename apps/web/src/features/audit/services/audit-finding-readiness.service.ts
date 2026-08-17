import { auditFindingService } from "./audit-finding.service";
export const auditFindingReadinessService = { calculate: auditFindingService.calculateReadiness };
