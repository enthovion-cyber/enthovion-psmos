import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ClosePermitPolicy {
  assertCanClose(permit: Record<string, any>) {
    if (!['Active', 'Suspended', 'Extended'].includes(permit.status)) throw new BadRequestException(`Cannot close permit from ${permit.status}`);
  }
}
