import { Injectable } from '@nestjs/common';
import { AuthService, RequestMeta } from './auth.service';

@Injectable()
export class AuthPasswordResetService {
  constructor(private readonly auth: AuthService) {}

  forgot(email: string, meta?: RequestMeta) {
    return this.auth.forgotPassword(email, meta);
  }

  reset(token: string, password: string, meta?: RequestMeta) {
    return this.auth.resetPassword(token, password, meta);
  }
}
