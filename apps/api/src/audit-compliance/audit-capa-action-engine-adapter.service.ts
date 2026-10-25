import { Injectable, Logger } from "@nestjs/common";
import { SupabaseService } from "../database/supabase.service";
import { ActionsService } from "../actions/actions.service";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { CreateActionDto } from "../actions/dto/create-action.dto";
import { UpdateActionDto } from "../actions/dto/update-action.dto";
import { CloseActionDto } from "../actions/dto/close-action.dto";

export interface CapaActionSyncResult {
  actionEngineId: string;
  actionNumber: string;
}

@Injectable()
export class AuditCapaActionEngineAdapterService {
  private readonly logger = new Logger(AuditCapaActionEngineAdapterService.name);

  constructor(
    private readonly db: SupabaseService,
    private readonly actionsService: ActionsService,
  ) {}

  /**
   * Synchronizes an Audit CAPA action to the Universal Action Engine (Action table).
   * Creates or updates the corresponding Action record and writes back the action_engine_id
   * and action_number_snapshot to audit_capa_actions.
   */
  async syncAction(
    user: RequestUser,
    capa: Record<string, any>,
    capaAction: Record<string, any>,
  ): Promise<CapaActionSyncResult | null> {
    try {
      let actionEngineId = capaAction.action_engine_id as string | null | undefined;
      let actionNumber = capaAction.action_number_snapshot as string | null | undefined;

      // Determine priority mapping: SAFETY_CRITICAL, HIGH, MEDIUM, LOW
      let priority: "SAFETY_CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
      const rawPriority = String(capaAction.priority ?? capa.priority ?? capa.criticality ?? "").toUpperCase();
      if (rawPriority.includes("CRITICAL") || Boolean(capaAction.safety_critical) || Boolean(capa.safety_critical)) {
        priority = "SAFETY_CRITICAL";
      } else if (rawPriority.includes("HIGH") || rawPriority.includes("MAJOR")) {
        priority = "HIGH";
      } else if (rawPriority.includes("LOW") || rawPriority.includes("MINOR")) {
        priority = "LOW";
      }

      const safeDueDate = String(
        capaAction.due_date ||
        capa.overall_due_date ||
        new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0]
      );
      const ownerId = (capaAction.owner_user_id as string) || (capa.capa_owner_user_id as string) || user.id;

      if (actionEngineId) {
        // Update existing action in universal Action Center
        try {
          const updateDto: UpdateActionDto = {
            title: (capaAction.action_title as string) || "Audit CAPA Action",
            description:
              (capaAction.action_description as string) ||
              (capaAction.completion_criteria as string) ||
              (capaAction.action_title as string),
            priority,
            ownerId,
            dueDate: safeDueDate,
            evidenceRequired: Boolean(capaAction.evidence_required),
            verificationRequired: Boolean(capaAction.verification_required),
          };
          const updated = await this.actionsService.update(user.tenantId, user.id, actionEngineId, updateDto);
          actionNumber = updated.actionNumber;
          await this.db
            .from("audit_capa_actions")
            .update({
              action_number_snapshot: actionNumber,
              action_synced_at: new Date().toISOString(),
              action_sync_status: "Synced",
            })
            .eq("company_id", user.tenantId)
            .eq("id", capaAction.id);
        } catch (err: any) {
          this.logger.warn(`Could not update existing Action Engine action ${actionEngineId}: ${err?.message ?? err}`);
        }
      } else {
        // Create new Action in Universal Action Engine
        const createDto: CreateActionDto = {
          sourceModule: "AUDIT",
          sourceType: "Audit CAPA",
          sourceRecordId: capaAction.id,
          title: (capaAction.action_title as string) || "Audit CAPA Action",
          description:
            (capaAction.action_description as string) ||
            (capaAction.completion_criteria as string) ||
            (capaAction.action_title as string),
          priority,
          ownerId,
          dueDate: safeDueDate,
          evidenceRequired: Boolean(capaAction.evidence_required),
          verificationRequired: Boolean(capaAction.verification_required),
          timingGate: "NOT_APPLICABLE",
        };

        const siteId = (capa.site_id as string) || (capaAction.site_id as string);
        if (siteId) createDto.siteId = siteId;

        const departmentId = (capa.responsible_department_id as string) || (capaAction.responsible_department_id as string);
        if (departmentId) createDto.departmentId = departmentId;

        const equipmentId = (capaAction.equipment_id as string) || (capa.equipment_id as string);
        if (equipmentId) createDto.equipmentId = equipmentId;

        const created = await this.actionsService.create(user.tenantId, user.id, createDto);

        actionEngineId = created.id;
        actionNumber = created.actionNumber;

        // Update audit_capa_actions with action_engine_id and snapshot
        await this.db
          .from("audit_capa_actions")
          .update({
            action_engine_id: actionEngineId,
            action_number_snapshot: actionNumber,
            action_synced_at: new Date().toISOString(),
            action_sync_status: "Synced",
          })
          .eq("company_id", user.tenantId)
          .eq("id", capaAction.id);
      }

      return actionEngineId && actionNumber ? { actionEngineId, actionNumber } : null;
    } catch (err: any) {
      this.logger.error(`Failed to synchronize CAPA action ${capaAction.id} to Action Engine: ${err?.message ?? err}`);
      return null;
    }
  }

  /**
   * Synchronizes lifecycle state transitions from CAPA action to Universal Action Engine.
   */
  async syncStatus(
    user: RequestUser,
    actionEngineId: string | null | undefined,
    lifecycle: string,
    notes?: string,
  ): Promise<void> {
    if (!actionEngineId) return;
    try {
      const action = await this.actionsService.get(user.tenantId, actionEngineId).catch(() => null);
      if (!action) return;

      const closeDto: CloseActionDto = notes ? { notes } : {};

      if (lifecycle === "complete") {
        if (action.status === "OPEN") {
          await this.actionsService.transition(user.tenantId, user.id, actionEngineId, "IN_PROGRESS").catch(() => null);
        }
        if (action.verificationRequired) {
          await this.actionsService.transition(user.tenantId, user.id, actionEngineId, "PENDING_VERIFICATION").catch(() => null);
        } else {
          await this.actionsService.close(user.tenantId, user.id, actionEngineId, closeDto).catch(() => null);
        }
      } else if (lifecycle === "verify") {
        if (action.status === "PENDING_VERIFICATION" || action.status === "IN_PROGRESS" || action.status === "OPEN") {
          await this.actionsService.close(user.tenantId, user.id, actionEngineId, closeDto).catch(() => null);
        }
      } else if (lifecycle === "reject" || lifecycle === "reopen") {
        if (action.status === "CLOSED" || action.status === "PENDING_VERIFICATION") {
          await this.actionsService.transition(user.tenantId, user.id, actionEngineId, "IN_PROGRESS").catch(() => null);
        }
      } else if (lifecycle === "cancel") {
        if (action.status === "OPEN" || action.status === "IN_PROGRESS") {
          await this.actionsService.transition(user.tenantId, user.id, actionEngineId, "CANCELLED").catch(() => null);
        }
      } else if (lifecycle === "assign") {
        if (action.status === "OPEN") {
          await this.actionsService.transition(user.tenantId, user.id, actionEngineId, "IN_PROGRESS").catch(() => null);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to sync status for Action Engine action ${actionEngineId}: ${err?.message ?? err}`);
    }
  }
}
