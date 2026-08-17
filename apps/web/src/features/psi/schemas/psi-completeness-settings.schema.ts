import { z } from 'zod';

export const psiCompletenessSettingsSchema = z.object({
  scoring_method: z.string().default('Weighted requirements'),
  critical_gap_score_cap: z.coerce.number().min(0).max(100).optional().nullable(),
  pssr_blocker_score_cap: z.coerce.number().min(0).max(100).optional().nullable(),
  auto_create_actions: z.coerce.boolean().default(false),
  auto_notify_owners: z.coerce.boolean().default(true),
  auto_create_pssr_blockers: z.coerce.boolean().default(true),
  allow_critical_waivers: z.coerce.boolean().default(false),
  require_esign_for_waiver: z.coerce.boolean().default(true),
  scheduled_run_enabled: z.coerce.boolean().default(false),
  scheduled_run_frequency: z.string().optional().nullable(),
  default_review_frequency_days: z.coerce.number().int().positive().optional().nullable()
});

export type PsiCompletenessSettingsInput = z.infer<typeof psiCompletenessSettingsSchema>;
