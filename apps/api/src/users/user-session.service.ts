import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UserSessionService {
  constructor(private readonly users: UsersService) {}

  forceLogout(tenantId: string, actorId: string, userId: string, reason?: string) {
    return this.users.forceLogout(tenantId, actorId, userId, reason);
  }
}
