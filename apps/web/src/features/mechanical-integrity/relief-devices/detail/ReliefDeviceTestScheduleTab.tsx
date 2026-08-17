import { DetailPanel, KeyValueGrid } from './detail-utils';

export function ReliefDeviceTestScheduleTab({ requirement, occurrences }: { requirement?: Record<string, unknown> | null | undefined; occurrences?: Record<string, unknown>[] | undefined }) {
  return <div className="space-y-5"><DetailPanel title="Test / Inspection Requirement"><KeyValueGrid data={requirement} /></DetailPanel><DetailPanel title="Occurrences"><KeyValueGrid data={{ count: occurrences?.length ?? 0, next: occurrences?.[0]?.due_date ?? 'None' }} /></DetailPanel></div>;
}
