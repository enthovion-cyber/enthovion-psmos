import { z } from 'zod';

export const psiIntegrationLinkSchema = z.object({
  integration_title: z.string().min(1),
  integration_type: z.string().min(1),
  source_module: z.string().min(1),
  source_record_id: z.string().min(1),
  relationship_type: z.string().min(1),
  impact_severity: z.string().optional(),
  notes: z.string().optional()
});

export const psiIntegrationSettingsSchema = z.object({
  pssr_min_completeness_score: z.coerce.number().min(0).max(100),
  block_moc_closure_on_critical_gap: z.boolean(),
  block_pssr_startup_on_critical_gap: z.boolean(),
  require_hazop_revalidation_on_psi_change: z.boolean(),
  require_mi_sync_on_equipment_basis_change: z.boolean(),
  allow_waiver_with_approval: z.boolean(),
  auto_create_actions_for_startup_blockers: z.boolean()
});
