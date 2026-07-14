import { incidentOverviewService } from './incident-overview.service';

export const incidentOverviewSnapshotsService = {
  event: (incidentId: string) => incidentOverviewService.section(incidentId, 'event-snapshot'),
  severityRisk: (incidentId: string) => incidentOverviewService.section(incidentId, 'severity-risk'),
  psmClassification: (incidentId: string) => incidentOverviewService.section(incidentId, 'psm-classification'),
  people: (incidentId: string) => incidentOverviewService.section(incidentId, 'people'),
  assetChemical: (incidentId: string) => incidentOverviewService.section(incidentId, 'asset-chemical'),
  immediateActions: (incidentId: string) => incidentOverviewService.section(incidentId, 'immediate-actions'),
  rcaBarrier: (incidentId: string) => incidentOverviewService.section(incidentId, 'rca-barrier'),
  actions: (incidentId: string) => incidentOverviewService.section(incidentId, 'actions'),
  linkedRecords: (incidentId: string) => incidentOverviewService.section(incidentId, 'linked-records'),
  evidence: (incidentId: string) => incidentOverviewService.section(incidentId, 'evidence'),
  regulatory: (incidentId: string) => incidentOverviewService.section(incidentId, 'regulatory'),
  lessonsLearned: (incidentId: string) => incidentOverviewService.section(incidentId, 'lessons-learned')
};
