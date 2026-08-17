import { DetailPanel, KeyValueGrid } from './detail-utils';

export function ReliefDeviceBasisTab({ data }: { data?: Record<string, unknown> | null | undefined }) {
  return <DetailPanel title="Relief Basis / Scenario"><KeyValueGrid data={data} /></DetailPanel>;
}
