import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementHeatmapService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  heatmap(user: RequestUser, query: Record<string, any> = {}) {
    return this.psmElements.heatmap(user, query);
  }
}
