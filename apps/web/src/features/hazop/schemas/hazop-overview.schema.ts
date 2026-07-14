import { z } from 'zod';

export const hazopOverviewSectionSchema = z.object({
  studyId: z.string().min(1),
  section: z.enum([
    'kpis',
    'progress',
    'risk-snapshot',
    'team-snapshot',
    'recommendations-preview',
    'linked-records-preview',
    'recent-activity',
    'attachments-preview',
    'readiness',
    'equipment-context'
  ])
});
