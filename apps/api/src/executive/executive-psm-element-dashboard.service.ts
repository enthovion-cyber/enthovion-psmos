import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementDashboardService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  dashboard(user: RequestUser, query: Record<string, any> = {}) {
    return this.psmElements.dashboard(user, query);
  }
}
