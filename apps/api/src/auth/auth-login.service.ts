import { Injectable } from '@nestjs/common';
import { AuthService, RequestMeta } from './auth.service';

@Injectable()
export class AuthLoginService {
  constructor(private readonly auth: AuthService) {}

  login(email: string, password: string, meta?: RequestMeta) {
    return this.auth.login(email, password, meta);
  }
}
