import { auditFindingService } from "./audit-finding.service";
export const auditFindingOwnershipService = { list: (id: string) => auditFindingService.section(id, "ownership"), assign: (id: string, payload: Record<string, unknown>) => auditFindingService.addSection(id, "ownership", payload) };
