import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';

export type ExpirySweepResult = {
  processedCount: number;
  overdueCount: number;
  escalatedCount: number;
  warningCount: number;
  items: Array<{
    mocId: string;
    mocNumber: string;
    title: string;
    expiryDate: string;
    daysRemaining: number;
    status: string;
    actionTaken: string;
  }>;
};

@Injectable()
export class MocTemporaryExpiryWorker {
  private readonly logger = new Logger(MocTemporaryExpiryWorker.name);

  constructor(
    private readonly db: SupabaseService,
    private readonly notifications: NotificationsService,
    private readonly actions: ActionsService,
    private readonly audit: AuditService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleDailyExpirySweep() {
    this.logger.log('Executing automated daily temporary MOC expiry sweep...');
    try {
      const result = await this.runExpiryCheck();
      this.logger.log(
        `Daily temporary MOC expiry sweep completed: ${result.processedCount} evaluated, ${result.overdueCount} overdue, ${result.escalatedCount} escalated.`
      );
    } catch (err) {
      this.logger.error('Failed to execute daily temporary MOC expiry sweep:', err);
    }
  }

  async runExpiryCheck(tenantId?: string): Promise<ExpirySweepResult> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();

    // Query active temporary controls that are not yet reversed/removed
    let query = this.db
      .from('moc_temporary_controls')
      .select('*, moc:mocs(id,tenant_id,company_id,site_id,moc_number,title,status,originator_id,responsible_owner_id,created_by)')
      .neq('status', 'Removed / Reversed');

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const controls = await this.db.many<any>(query);

    const result: ExpirySweepResult = {
      processedCount: 0,
      overdueCount: 0,
      escalatedCount: 0,
      warningCount: 0,
      items: []
    };

    for (const control of controls) {
      const moc = control.moc;
      if (!moc || ['Closed', 'Cancelled'].includes(moc.status)) {
        continue;
      }

      result.processedCount++;
      const expiryDate = control.expiry_date ? new Date(control.expiry_date) : null;
      if (!expiryDate) continue;

      const diffTime = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const targetTenantId = control.tenant_id || moc.tenant_id;
      const targetSiteId = moc.site_id;
      const targetCompanyId = moc.company_id;
      const ownerId = control.removal_owner_id || control.responsible_owner_id || moc.originator_id || moc.created_by;

      let actionTaken = 'No escalation needed';

      if (daysRemaining <= 0) {
        // OVERDUE
        result.overdueCount++;
        actionTaken = 'Overdue Alert + Safety Critical Action Spawned';

        await this.db.single(
          this.db
            .from('moc_temporary_controls')
            .update({
              status: 'Overdue',
              normalization_risk: true,
              updated_at: now.toISOString()
            })
            .eq('id', control.id)
            .select()
            .maybeSingle()
        );

        if (ownerId) {
          await this.notifications
            .notifyUser({
              tenantId: targetTenantId,
              userId: ownerId,
              siteId: targetSiteId,
              companyId: targetCompanyId,
              type: 'moc.temporary.expired',
              module: 'moc',
              title: `CRITICAL: Temporary MOC ${moc.moc_number} EXPIRED`,
              message: `Temporary MOC '${moc.title}' expired on ${control.expiry_date}. Immediate removal/reversal or emergency extension required.`,
              relatedRecordId: moc.id,
              relatedRecordType: 'MOC',
              relatedUrl: `/moc/${moc.id}`,
              priority: 'High'
            })
            .catch(() => null);
        }

        // Auto-spawn or escalate action in Universal Action Engine
        await this.ensureOverdueAction(targetTenantId, moc, ownerId, control.expiry_date);
      } else if (daysRemaining <= 7) {
        // 7-DAY ESCALATION
        result.escalatedCount++;
        actionTaken = '7-Day High-Priority Escalation Notice';

        if (ownerId) {
          await this.notifications
            .notifyUser({
              tenantId: targetTenantId,
              userId: ownerId,
              siteId: targetSiteId,
              companyId: targetCompanyId,
              type: 'moc.temporary.expiring_7d',
              module: 'moc',
              title: `ESCALATION: Temporary MOC ${moc.moc_number} Expires in ${daysRemaining} Days`,
              message: `Temporary modification '${moc.title}' will expire on ${control.expiry_date}. Prepare removal verification or submit extension.`,
              relatedRecordId: moc.id,
              relatedRecordType: 'MOC',
              relatedUrl: `/moc/${moc.id}`,
              priority: 'High'
            })
            .catch(() => null);
        }
      } else if (daysRemaining <= 14) {
        // 14-DAY WARNING
        result.warningCount++;
        actionTaken = '14-Day Warning Notice';

        if (ownerId) {
          await this.notifications
            .notifyUser({
              tenantId: targetTenantId,
              userId: ownerId,
              siteId: targetSiteId,
              companyId: targetCompanyId,
              type: 'moc.temporary.expiring_14d',
              module: 'moc',
              title: `Warning: Temporary MOC ${moc.moc_number} Expires in 14 Days`,
              message: `Scheduled expiration date: ${control.expiry_date}.`,
              relatedRecordId: moc.id,
              relatedRecordType: 'MOC',
              relatedUrl: `/moc/${moc.id}`,
              priority: 'Normal'
            })
            .catch(() => null);
        }
      } else if (daysRemaining <= 30) {
        // 30-DAY NOTICE
        actionTaken = '30-Day Expiry Notice';

        if (ownerId) {
          await this.notifications
            .notifyUser({
              tenantId: targetTenantId,
              userId: ownerId,
              siteId: targetSiteId,
              companyId: targetCompanyId,
              type: 'moc.temporary.expiring_30d',
              module: 'moc',
              title: `Notice: Temporary MOC ${moc.moc_number} Expiry Approaching (30 Days)`,
              message: `Temporary change will reach end of permitted duration on ${control.expiry_date}.`,
              relatedRecordId: moc.id,
              relatedRecordType: 'MOC',
              relatedUrl: `/moc/${moc.id}`,
              priority: 'Normal'
            })
            .catch(() => null);
        }
      }

      result.items.push({
        mocId: moc.id,
        mocNumber: moc.moc_number,
        title: moc.title,
        expiryDate: control.expiry_date,
        daysRemaining,
        status: control.status,
        actionTaken
      });
    }

    return result;
  }

  private async ensureOverdueAction(tenantId: string, moc: any, ownerId: string, expiryDate: string) {
    try {
      // Check if overdue action already exists
      const existing = await this.db.many<any>(
        this.db
          .from('moc_required_actions')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('moc_id', moc.id)
          .eq('action_type', 'Temporary Expiry Overdue')
      );

      if (existing.length > 0) return;

      const actionTitle = `Execute Temporary MOC Reversal / Extension (${moc.moc_number})`;
      const actionDesc = `Temporary change '${moc.title}' passed its permitted expiry date (${expiryDate}). Physical reversal or formal extension approval must occur immediately.`;

      // Insert into moc_required_actions
      const row = await this.db.single<any>(
        this.db
          .from('moc_required_actions')
          .insert({
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            company_id: moc.company_id,
            site_id: moc.site_id,
            moc_id: moc.id,
            action_type: 'Temporary Expiry Overdue',
            source_type: 'Temporary Control',
            source_record_id: moc.id,
            action_title: actionTitle,
            title: actionTitle,
            description: actionDesc,
            linked_module: 'Temporary Control',
            priority: 'SAFETY_CRITICAL',
            due_date: new Date().toISOString().slice(0, 10),
            required: true,
            system_generated: true,
            status: 'Preview',
            required_before_startup: true,
            required_before_closure: true,
            evidence_required: true,
            verification_required: true,
            owner_id: ownerId,
            created_by: ownerId
          })
          .select()
          .single()
      );

      // Create in Universal Action Engine with PRE_STARTUP timingGate
      const universalAction = await this.actions.create(tenantId, ownerId, {
        title: actionTitle,
        description: actionDesc,
        sourceModule: 'MOC',
        sourceType: 'Temporary Control',
        sourceRecordId: moc.id,
        priority: 'SAFETY_CRITICAL',
        ownerId: ownerId,
        siteId: moc.site_id,
        departmentId: moc.department_id,
        dueDate: new Date().toISOString().slice(0, 10),
        evidenceRequired: true,
        verificationRequired: true,
        timingGate: 'PRE_STARTUP'
      } as any);

      await this.db.single(
        this.db
          .from('moc_required_actions')
          .update({
            action_id: universalAction.id,
            status: 'Created',
            updated_at: new Date().toISOString()
          })
          .eq('tenant_id', tenantId)
          .eq('id', row.id)
          .select()
          .single()
      );
    } catch (err) {
      this.logger.warn(`Failed to create overdue action for MOC ${moc.id}:`, err);
    }
  }
}
