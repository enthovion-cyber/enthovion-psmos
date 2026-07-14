import { TabPanel } from '../shared/IncidentTabPrimitives';
import { ReviewBox } from './AssetPanelPrimitives';
export function AssetChemicalReviewPanel({ review, onApprove, onReject }: any) { return <TabPanel title="Asset / Chemical Review Panel"><ReviewBox review={review} onApprove={onApprove} onReject={onReject} /></TabPanel>; }
