import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UserAuditService {
  constructor(private readonly users: UsersService) {}

  list(tenantId: string, userId: string) {
    return this.users.userAudit(tenantId, userId);
  }
}
