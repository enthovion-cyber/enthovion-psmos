import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';
export function EvidenceAttachmentHistoryPanel({ rows }: { rows: any[] }) { return <TabPanel title="Evidence / Attachment History"><TimelineList rows={rows ?? []} empty="No evidence or attachment history events were returned." /></TabPanel>; }
