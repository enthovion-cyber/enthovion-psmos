import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class SessionRefreshService {
  constructor(private readonly auth: AuthService) {}

  refresh(userId: string, tenantId: string) {
    return this.auth.refreshSession(userId, tenantId);
  }
}
