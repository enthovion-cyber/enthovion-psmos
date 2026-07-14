import { Injectable } from '@nestjs/common';

@Injectable()
export class MocClosureBlockerService {
  list(moc: any) {
    return (moc.actions ?? [])
      .filter((item: any) => item.required !== false && item.required_before_closure && !(item.evidence_status === 'Uploaded' || item.evidence_status === 'Accepted') && item.verification_status !== 'Verified')
      .map((item: any) => ({ type: 'Action', title: item.title, status: item.status, priority: item.priority, actionId: item.action_id ?? item.id, evidenceStatus: item.evidence_status, verificationStatus: item.verification_status }));
  }
}
