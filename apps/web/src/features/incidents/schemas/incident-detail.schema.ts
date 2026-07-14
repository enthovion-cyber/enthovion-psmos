import { z } from 'zod';

export const incidentDetailActionSchema = z.object({
  key: z.string(),
  label: z.string(),
  enabled: z.boolean(),
  disabledReason: z.string().nullable().optional()
});

export const incidentDetailTabSchema = z.object({
  key: z.string(),
  label: z.string(),
  status: z.string(),
  implemented: z.boolean(),
  restricted: z.boolean().optional(),
  blocker: z.boolean().optional(),
  href: z.string()
});

export const incidentOverviewSummaryCardSchema = z.object({
  label: z.string(),
  value: z.unknown(),
  tone: z.string().optional(),
  help: z.string().optional()
});

export const incidentOverviewSchema = z.object({
  restricted: z.boolean().optional(),
  header: z.record(z.unknown()),
  summaryCards: z.array(incidentOverviewSummaryCardSchema),
  eventSnapshot: z.record(z.unknown()).optional(),
  severityRisk: z.record(z.unknown()).optional(),
  psmClassification: z.record(z.unknown()).optional(),
  investigationReadiness: z.record(z.unknown()).optional(),
  peopleSnapshot: z.record(z.unknown()).optional(),
  assetChemicalSnapshot: z.record(z.unknown()).optional(),
  immediateActionsSnapshot: z.record(z.unknown()).optional(),
  rcaBarrierSnapshot: z.record(z.unknown()).optional(),
  capaSnapshot: z.record(z.unknown()).optional(),
  linkedPsmRecordsSnapshot: z.record(z.unknown()).optional(),
  evidenceSnapshot: z.record(z.unknown()).optional(),
  regulatoryNotificationSnapshot: z.record(z.unknown()).optional(),
  lessonsLearnedSnapshot: z.record(z.unknown()).optional(),
  recentActivity: z.array(z.record(z.unknown())).optional(),
  blockersNextSteps: z.record(z.unknown()).optional(),
  quickLinks: z.array(z.record(z.unknown())).optional(),
  charts: z.record(z.unknown()).optional(),
  generatedAt: z.string().optional()
});

export const incidentDetailSchema = z.object({
  header: z.record(z.unknown()),
  statusBar: z.record(z.unknown()),
  tabs: z.object({ tabs: z.array(incidentDetailTabSchema) }),
  overview: incidentOverviewSchema,
  quickActions: z.array(incidentDetailActionSchema),
  permissions: z.record(z.boolean()),
  generatedAt: z.string()
});
