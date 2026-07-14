import { LinkedReadinessPanel } from './LinkedRecordUi';

export function RequiredMissingLinksPanel({ required }: { required: any }) {
  return <LinkedReadinessPanel title="Required Links / Missing Links" readiness={required} />;
}
