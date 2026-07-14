import { Injectable } from '@nestjs/common';
import { TenantContext } from './tenant-context.service';

@Injectable()
export class SiteContextService {
  selectedSite(context: TenantContext) {
    return context.selectedSite ?? null;
  }

  selectedWorkspace(context: TenantContext) {
    return context.selectedWorkspace ?? null;
  }
}
