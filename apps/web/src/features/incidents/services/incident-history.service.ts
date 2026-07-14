import { incidentDetailService } from './incident-detail.service';
export const incidentHistoryService = { tab: incidentDetailService.history, diff: incidentDetailService.historyDiff, export: incidentDetailService.exportHistory };
