import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ExtendPermitPolicy {
  assertCanExtend(permit: Record<string, any>, newExpiryAt: string) {
    if (!['Issued', 'Active', 'Extended'].includes(permit.status)) throw new BadRequestException(`Cannot extend permit from ${permit.status}`);
    if (new Date(newExpiryAt) <= new Date(permit.planned_end_at)) throw new BadRequestException('New expiry must be later than current expiry');
    if ((permit.extension_count ?? 0) >= 3) throw new BadRequestException('Maximum extension count reached');
  }
}
