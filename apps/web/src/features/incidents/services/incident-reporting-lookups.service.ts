import { incidentDetailService } from './incident-detail.service';
export const incidentReportingLookupsService = { context: (id: string) => incidentDetailService.notificationsReporting(id).then((data: any) => data.context) };
