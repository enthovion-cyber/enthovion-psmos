import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementGapService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  gaps(user: RequestUser, query: Record<string, any> = {}) {
    return this.psmElements.gaps(user, query);
  }
}
