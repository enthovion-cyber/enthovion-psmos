import { Injectable } from '@nestjs/common';
import { AuditService, AuditInput } from '../audit/audit.service';

@Injectable()
export class AuditLogIntegrationService {
  constructor(private readonly audit: AuditService) {}

  write(input: AuditInput) {
    return this.audit.write(input);
  }
}
