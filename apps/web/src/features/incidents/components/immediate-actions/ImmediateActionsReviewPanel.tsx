import { TabPanel } from '../shared/IncidentTabPrimitives';
import { ReviewBox } from './ImmediateActionsPrimitives';
export function ImmediateActionsReviewPanel({ review, onApprove, onReject }: any) { return <TabPanel title="Immediate Actions Review"><ReviewBox review={review} onApprove={onApprove} onReject={onReject} /></TabPanel>; }
