import { z } from 'zod';

export const regulatoryEvidencePackageSchema = z.object({
  packageTitle: z.string().min(1, 'Evidence package title is required.'),
  packageType: z.string().min(1, 'Package type is required.'),
  ownerUserId: z.string().optional(),
  notes: z.string().optional(),
  includeRestricted: z.boolean().optional()
});

export type RegulatoryEvidencePackageValues = z.infer<typeof regulatoryEvidencePackageSchema>;
