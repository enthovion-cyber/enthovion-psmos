import { TabPanel } from '../shared/IncidentTabPrimitives';
import { ReviewBox } from './PeoplePanelPrimitives';
export function PeopleInjuryReviewPanel({ review, onApprove, onReject }: any) { return <TabPanel title="People / Injury Review Panel"><ReviewBox review={review} onApprove={onApprove} onReject={onReject} /></TabPanel>; }
