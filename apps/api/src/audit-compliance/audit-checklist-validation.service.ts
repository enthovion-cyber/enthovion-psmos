import { BadRequestException, Injectable } from "@nestjs/common";
@Injectable()
export class AuditChecklistValidationService {
  identity(dto: Record<string, any>) {
    for (const key of [
      "checklistTitle",
      "checklistCode",
      "templateType",
      "auditType",
      "criticality",
    ])
      if (!dto[key]) throw new BadRequestException(`${key} is required.`);
    return true;
  }
}
