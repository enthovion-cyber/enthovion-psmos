import { TabPanel } from '../shared/IncidentTabPrimitives';
import { ReviewBox } from './InvestigationTeamPrimitives';
export function TeamReviewPanel({ review, onRequest, onApprove, onReject }: any) { return <TabPanel title="Team Review"><ReviewBox review={review} onRequest={onRequest} onApprove={onApprove} onReject={onReject} /></TabPanel>; }
