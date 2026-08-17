import { DetailPanel, KeyValueGrid } from './detail-utils';

export function ReliefDeviceTechnicalDataTab({ data }: { data?: Record<string, unknown> | null | undefined }) {
  return <DetailPanel title="Relief Device Technical Data"><KeyValueGrid data={data} /></DetailPanel>;
}
