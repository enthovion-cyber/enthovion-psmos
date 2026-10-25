import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementRegistryService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  elements(user: RequestUser, query: Record<string, any> = {}) {
    return this.psmElements.elements(user, query);
  }
  detail(user: RequestUser, id: string, query: Record<string, any> = {}) {
    return this.psmElements.detail(user, id, query);
  }
  create(user: RequestUser, dto: Record<string, any>) {
    return this.psmElements.create(user, dto);
  }
  update(user: RequestUser, id: string, dto: Record<string, any>) {
    return this.psmElements.update(user, id, dto);
  }
  archive(user: RequestUser, id: string, dto: Record<string, any>) {
    return this.psmElements.archive(user, id, dto);
  }
}
