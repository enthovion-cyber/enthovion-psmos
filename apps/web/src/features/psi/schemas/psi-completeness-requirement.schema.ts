import { z } from 'zod';

export const psiCompletenessRequirementSchema = z.object({
  requirement_title: z.string().min(1, 'Requirement title is required.'),
  requirement_code: z.string().min(1).optional(),
  psi_module: z.string().min(1, 'PSI module is required.'),
  requirement_category: z.string().min(1, 'Requirement category is required.'),
  applicability_scope: z.string().min(1).default('Unit'),
  required_evidence_type: z.string().optional().nullable(),
  required_source_module: z.string().optional().nullable(),
  required_document_type: z.string().optional().nullable(),
  required_review_frequency_days: z.coerce.number().int().positive().optional().nullable(),
  weight: z.coerce.number().min(0).default(1),
  severity_if_missing: z.string().default('Medium'),
  pssr_blocker_if_missing: z.coerce.boolean().default(false),
  moc_required_if_changed: z.coerce.boolean().default(false),
  action_required_if_missing: z.coerce.boolean().default(true),
  waiver_allowed: z.coerce.boolean().default(true),
  owner_role: z.string().optional().nullable(),
  active: z.coerce.boolean().default(true)
});

export type PsiCompletenessRequirementFormInput = z.infer<typeof psiCompletenessRequirementSchema>;
