import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UserAccessScopeService {
  constructor(private readonly users: UsersService) {}

  update(tenantId: string, actorId: string, userId: string, dto: { companyIds?: string[]; siteIds?: string[]; unitIds?: string[]; areaIds?: string[]; replace?: boolean }) {
    return this.users.updateAccessScope(tenantId, actorId, userId, dto);
  }
}
