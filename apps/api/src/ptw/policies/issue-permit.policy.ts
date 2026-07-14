import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class IssuePermitPolicy {
  assertCanIssue(permit: Record<string, any>) {
    if (permit.status !== 'Approved') throw new BadRequestException(`Cannot issue permit from ${permit.status}`);
  }
}
