import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class AuthSiteSelectionService {
  constructor(private readonly tenants: TenantsService) {}

  async sites(user: RequestUser) {
    const context = await this.tenants.context(user);
    return context.sites;
  }

  select(user: RequestUser, siteId: string | null) {
    return this.tenants.switchSite(user, siteId, {});
  }
}
