import { Injectable } from '@nestjs/common';
import { AuthService, RequestMeta } from './auth.service';

@Injectable()
export class AuthForcePasswordChangeService {
  constructor(private readonly auth: AuthService) {}

  complete(tenantId: string, userId: string, currentPassword: string | undefined, newPassword: string, meta?: RequestMeta) {
    return this.auth.forceChangePassword(tenantId, userId, currentPassword, newPassword, meta);
  }
}
