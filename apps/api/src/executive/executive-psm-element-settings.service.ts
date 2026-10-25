import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementSettingsService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  settings(user: RequestUser) {
    return this.psmElements.settings(user);
  }
  update(user: RequestUser, dto: Record<string, any>) {
    return this.psmElements.updateSettings(user, dto);
  }
}
