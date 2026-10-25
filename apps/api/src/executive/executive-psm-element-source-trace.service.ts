import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementSourceTraceService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  async sourceTrace(user: RequestUser, elementId: string) {
    const detail = await this.psmElements.detail(user, elementId);
    return detail.sourceTrace;
  }
}
