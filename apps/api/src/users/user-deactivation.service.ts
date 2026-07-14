import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UserDeactivationService {
  constructor(private readonly users: UsersService) {}

  deactivate(tenantId: string, actorId: string, userId: string) {
    return this.users.setStatus(tenantId, actorId, userId, 'DEACTIVATED');
  }

  reactivate(tenantId: string, actorId: string, userId: string) {
    return this.users.setStatus(tenantId, actorId, userId, 'ACTIVE');
  }
}
