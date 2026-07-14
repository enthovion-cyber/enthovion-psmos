import { Injectable } from '@nestjs/common';
import { PermitRepository } from '../repositories/permit.repository';

@Injectable()
export class GasTestReminderJob {
  constructor(private readonly repo: PermitRepository) {}

  async run(tenantId: string) {
    const overdueTests = await this.repo.db.many<any>(
      this.repo.gasTests()
        .select('*, permit:permits(*)')
        .eq('tenant_id', tenantId)
        .lt('next_test_due_at', new Date().toISOString())
        .order('tested_at', { ascending: false })
    );
    const processed = new Set<string>();
    for (const test of overdueTests) {
      const permit = test.permit;
      if (!permit || processed.has(permit.id) || !['Active', 'Extended'].includes(permit.status)) continue;
      processed.add(permit.id);
      await this.repo.db.single(this.repo.permits().update({ status: 'Suspended', suspended_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', permit.id).select().single());
      await this.repo.db.single(this.repo.history().insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: permit.company_id,
        site_id: permit.site_id,
        permit_id: permit.id,
        event_type: 'GAS_RETEST_OVERDUE',
        title: 'Permit auto-suspended because gas retest is overdue',
        before_data: permit,
        after_data: { status: 'Suspended', overdueGasTestId: test.id },
        created_by: permit.created_by,
        updated_at: new Date().toISOString()
      }).select().single());
    }
    return { job: 'gas-test-reminder', suspended: processed.size };
  }
}
