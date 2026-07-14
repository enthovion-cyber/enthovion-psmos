import { SignatureLifecycleBlocker } from '../policies/signature-lifecycle-blocker';
import { SignaturePolicyEngine } from '../policies/signature-policy.engine';

export class PtwSignatureService {
  static requirementsForPermit(permit: Record<string, any>) {
    return SignaturePolicyEngine.calculate(permit);
  }

  static summary(rows: Array<Record<string, any>>) {
    const required = rows.filter((row) => row.status !== 'Skipped by Rule' && row.status !== 'Not Required');
    const completed = rows.filter((row) => row.status === 'Signed');
    const rejected = rows.filter((row) => row.status === 'Rejected');
    const pending = required.filter((row) => ['Pending', 'Revalidation Required', 'Expired'].includes(row.status));
    const blockers = SignatureLifecycleBlocker.blockers(rows);
    return {
      totalRequired: required.length,
      completed: completed.length,
      pending: pending.length,
      rejected: rejected.length,
      completionPercent: required.length ? Math.round((completed.length / required.length) * 100) : 100,
      status: rejected.length ? 'Rejected' : required.length === 0 ? 'Not Required' : pending.length === 0 ? 'Complete' : completed.length ? 'Partially Complete' : 'Pending',
      lifecycleBlocked: blockers.length > 0,
      blockers
    };
  }
}
