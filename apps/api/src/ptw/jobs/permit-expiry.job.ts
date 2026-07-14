import { Injectable } from '@nestjs/common';
import { PermitRepository } from '../repositories/permit.repository';

@Injectable()
export class PermitExpiryJob {
  constructor(private readonly repo: PermitRepository) {}

  async run(tenantId: string) {
    const now = new Date().toISOString();
    const expired = await this.repo.db.many<any>(
      this.repo.permits()
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['Issued', 'Active', 'Extended'])
        .lt('planned_end_at', now)
    );
    for (const permit of expired) {
      await this.repo.db.single(this.repo.permits().update({ status: 'Suspended', suspended_at: now, updated_at: now }).eq('tenant_id', tenantId).eq('id', permit.id).select().single());
      await this.repo.db.single(this.repo.history().insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: permit.company_id,
        site_id: permit.site_id,
        permit_id: permit.id,
        event_type: 'PERMIT_EXPIRED',
        title: 'Permit auto-suspended because expiry time passed',
        before_data: permit,
        after_data: { status: 'Suspended' },
        created_by: permit.created_by,
        updated_at: now
      }).select().single());
    }
    return { job: 'permit-expiry', suspended: expired.length };
  }
}
