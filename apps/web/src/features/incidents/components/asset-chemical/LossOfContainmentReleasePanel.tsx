import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';
import { LopcStatusBadge } from '../shared/LopcStatusBadge';
export function LossOfContainmentReleasePanel({ data }: any) { return <TabPanel title="Loss of Containment / Release Details Panel"><div className="mb-3"><LopcStatusBadge value={data?.lopcStatus} /></div><InfoRows rows={[['Released material', data?.releasedMaterial], ['Released quantity', data?.releasedQuantity], ['Release unit', data?.releaseUnit], ['Release duration', data?.releaseDuration], ['Threshold exceeded', data?.thresholdExceeded]]} /></TabPanel>; }
