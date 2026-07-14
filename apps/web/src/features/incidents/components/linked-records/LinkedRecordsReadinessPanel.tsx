import { TabPanel } from '../shared/IncidentTabPrimitives';
import { LinkedRecordReadinessContent } from './LinkedRecordsPrimitives';
export function LinkedRecordsReadinessPanel({ readiness }: { readiness: any }) { return <TabPanel title="Linked Records Readiness / Missing Data Panel"><LinkedRecordReadinessContent readiness={readiness} /></TabPanel>; }
