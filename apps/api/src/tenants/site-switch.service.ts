import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';

@Injectable()
export class SiteSwitchService {
  constructor(private readonly tenants: TenantsService) {}

  switch(user: RequestUser, siteId: string | null, meta?: { ip?: string | null; userAgent?: string | null }) {
    return this.tenants.switchSite(user, siteId, meta);
  }
}
