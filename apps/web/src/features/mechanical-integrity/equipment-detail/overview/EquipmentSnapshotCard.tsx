import { DataPanel } from './panel-utils';

export function EquipmentSnapshotCard({ snapshot }: { snapshot: Record<string, unknown> }) {
  return <DataPanel title="Equipment Snapshot" data={snapshot} />;
}
