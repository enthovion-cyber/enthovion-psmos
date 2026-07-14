import { TabPanel } from '../shared/IncidentTabPrimitives';
import { ReviewBox } from './EvidencePrimitives';

export function EvidenceReviewPanel({ review, onApprove, onReject }: any) {
  return <TabPanel title="Evidence Review Panel"><ReviewBox review={review} onApprove={onApprove} onReject={onReject} /></TabPanel>;
}
