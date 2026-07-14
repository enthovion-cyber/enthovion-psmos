import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ClosureCompleteValidator {
  assertComplete(checklist: Record<string, any> | null, workforce: Record<string, any>[], isolations: Record<string, any>[], overrideReason?: string) {
    const items = checklist?.items ?? {};
    const required = ['workCompleted', 'toolsRemoved', 'housekeepingCompleted', 'personnelAccounted', 'equipmentSafe', 'areaInspected'];
    const missing = required.filter((key) => items[key] !== true);
    if (missing.length && !overrideReason) throw new BadRequestException(`Closure checklist incomplete: ${missing.join(', ')}`);
    const signedIn = workforce.filter((worker) => worker.signed_in === true || (worker.time_in && !worker.time_out));
    if (signedIn.length && !overrideReason) throw new BadRequestException('All personnel must be signed out before closure');
    const activeIsolations = isolations.filter((item) => ['Confirmed', 'Verified', 'De-Isolation Started'].includes(item.isolation_status ?? item.status) && !item.deisolated_at);
    if (activeIsolations.length && !overrideReason) throw new BadRequestException('Confirmed isolations must be de-isolated before closure');
    const removalPending = isolations.filter((item) => item.verification_required === true && item.deisolated_at && (item.isolation_status ?? item.status) !== 'Removal Verified');
    if (removalPending.length && !overrideReason) throw new BadRequestException('De-isolated points require removal verification before closure');
  }
}
