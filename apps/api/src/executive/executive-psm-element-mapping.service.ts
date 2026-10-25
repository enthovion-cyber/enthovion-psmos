import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementMappingService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  mappings(user: RequestUser, query: Record<string, any> = {}) {
    return this.psmElements.mappings(user, query);
  }
  createMapping(user: RequestUser, dto: Record<string, any>) {
    return this.psmElements.createMapping(user, dto);
  }
  updateMapping(user: RequestUser, id: string, dto: Record<string, any>) {
    return this.psmElements.updateMapping(user, id, dto);
  }
}
