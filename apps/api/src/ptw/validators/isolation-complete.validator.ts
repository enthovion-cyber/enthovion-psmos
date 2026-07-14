import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class IsolationCompleteValidator {
  assertComplete(permit: Record<string, any>, isolations: Record<string, any>[]) {
    const isolationRequired = permit.isolation_required === true || permit.required_controls?.isolationRequired === true || ['ELECTRICAL_ISOLATION', 'LINE_BREAKING'].includes(permit.permit_type);
    if (!isolationRequired) return;
    if (!isolations.length) throw new BadRequestException('Isolation register is required before activation');
    const incomplete = isolations.filter((item) => !['Confirmed', 'Verified', 'De-Isolation Started', 'De-Isolated', 'Removal Verified'].includes(item.isolation_status ?? item.status));
    if (incomplete.length) throw new BadRequestException('All isolation points must be confirmed before activation');
    const unverified = isolations.filter((item) => item.second_person_verification_required === true && !['Verified', 'De-Isolation Started', 'De-Isolated', 'Removal Verified'].includes(item.isolation_status ?? item.status));
    if (unverified.length) throw new BadRequestException('Second-person verification is required before activation');
  }
}
