import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class AuthWorkspaceSelectionService {
  constructor(private readonly tenants: TenantsService) {}

  workspaces(user: RequestUser) {
    return this.tenants.context(user);
  }

  select(user: RequestUser, companyId: string) {
    return this.tenants.switchCompany(user, companyId, {});
  }
}
