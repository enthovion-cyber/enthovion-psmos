import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditProgramStatusService {
  nextStatus(input: { requested?: string | null; current?: string | null; health?: string | null; archivedAt?: string | null; nextReviewDue?: string | null }) {
    if (input.archivedAt) return 'Archived';
    if (input.nextReviewDue && new Date(input.nextReviewDue).getTime() < Date.now() && input.current !== 'Draft') return 'Review Overdue';
    if (input.requested === 'activate') return input.health === 'Complete' ? 'Active' : 'Configuration Incomplete';
    if (input.requested === 'submit-review') return 'Pending Review';
    if (input.current) return input.current;
    return 'Draft';
  }
}
