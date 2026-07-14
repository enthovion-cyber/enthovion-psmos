import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UserPasswordService {
  constructor(private readonly users: UsersService) {}

  resetByAdmin(tenantId: string, actorId: string, userId: string, generateTemporaryPassword = false) {
    return this.users.adminResetPassword(tenantId, actorId, userId, generateTemporaryPassword);
  }

  changeOwn(tenantId: string, actorId: string, currentPassword: string | undefined, newPassword: string) {
    return this.users.changeOwnPassword(tenantId, actorId, currentPassword, newPassword);
  }
}
