import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';

@Injectable()
export class CompanySwitchService {
  constructor(private readonly tenants: TenantsService) {}

  switch(user: RequestUser, companyId: string, meta?: { ip?: string | null; userAgent?: string | null }) {
    return this.tenants.switchCompany(user, companyId, meta);
  }
}
