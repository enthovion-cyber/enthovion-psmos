import { Injectable } from '@nestjs/common';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementLookupService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  lookups() {
    return this.psmElements.lookups();
  }
}
