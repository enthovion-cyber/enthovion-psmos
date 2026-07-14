import { UnauthorizedException } from '@nestjs/common';

export class TenantNotFoundException extends UnauthorizedException {
  constructor() {
    super('Tenant context is required.');
  }
}
