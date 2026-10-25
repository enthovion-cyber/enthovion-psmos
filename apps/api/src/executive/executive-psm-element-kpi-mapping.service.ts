import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementKpiMappingService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  kpiMappings(user: RequestUser, query: Record<string, any> = {}) {
    return this.psmElements.kpiMappings(user, query);
  }
  createKpiMapping(user: RequestUser, dto: Record<string, any>) {
    return this.psmElements.createKpiMapping(user, dto);
  }
  updateKpiMapping(user: RequestUser, id: string, dto: Record<string, any>) {
    return this.psmElements.updateKpiMapping(user, id, dto);
  }
}
