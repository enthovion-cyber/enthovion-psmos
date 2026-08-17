import { DetailPanel, KeyValueGrid } from './detail-utils';

export function ReliefDeviceSealLockTab({ data }: { data?: Record<string, unknown> | null | undefined }) {
  return <DetailPanel title="Seal / Lock / Car-Seal Tracking"><KeyValueGrid data={data} /></DetailPanel>;
}
