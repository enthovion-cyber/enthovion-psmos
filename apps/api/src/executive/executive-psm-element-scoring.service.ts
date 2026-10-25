import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementScoringService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  scores(user: RequestUser, query: Record<string, any> = {}) {
    return this.psmElements.scores(user, query);
  }
  recalculate(user: RequestUser, id: string, query: Record<string, any> = {}) {
    return this.psmElements.recalculate(user, id, query);
  }
}
