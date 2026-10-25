import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementSiteBreakdownService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  siteBreakdown(user: RequestUser, query: Record<string, any> = {}) {
    return this.psmElements.breakdown(user, 'site', query);
  }
}
