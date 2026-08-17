import { auditFindingService } from "./audit-finding.service";
export const auditFindingConversionService = { options: auditFindingService.convertOptions, convertFieldFinding: auditFindingService.convertFieldFinding, createFromResponse: auditFindingService.createFromResponse };
