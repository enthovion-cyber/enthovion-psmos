import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthProviderIntegrationService {
  providerName() {
    return 'local-jwt-compatible';
  }
}
