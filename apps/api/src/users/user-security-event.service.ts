import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UserSecurityEventService {
  constructor(private readonly users: UsersService) {}

  list(tenantId: string, userId: string) {
    return this.users.securityEvents(tenantId, userId);
  }
}
