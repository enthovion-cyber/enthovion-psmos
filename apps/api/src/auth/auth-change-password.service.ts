import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthChangePasswordService {
  constructor(private readonly users: UsersService) {}

  change(tenantId: string, userId: string, currentPassword: string | undefined, newPassword: string) {
    return this.users.changeOwnPassword(tenantId, userId, currentPassword, newPassword);
  }
}
