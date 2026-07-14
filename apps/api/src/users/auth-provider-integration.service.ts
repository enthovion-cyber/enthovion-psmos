import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthProviderIntegrationService {
  async syncUserStatus() {
    return { synced: true };
  }
}
