import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function ReviewApprovalSignatureHistoryPanel({ rows }: { rows: any[] }) { return <TabPanel title="Review / Approval / E-Signature History"><TimelineList rows={rows ?? []} empty="No review, approval, or e-signature events were returned." /></TabPanel>; }
