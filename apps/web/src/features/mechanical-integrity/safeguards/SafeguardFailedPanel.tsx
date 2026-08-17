import type { MiSafeguardRow } from '../types/safeguard-common.types';
import { SafeguardRegisterTable, SectionCard } from './SafeguardUiPrimitives';

export function SafeguardFailedPanel({ rows, onOpen }: { rows?: MiSafeguardRow[]; onOpen?: (row: MiSafeguardRow) => void }) {
  return (
    <SectionCard title="Failed / Degraded Safeguards" description="Failed proof tests, failed demands, degraded components, and records requiring follow-up.">
      <SafeguardRegisterTable rows={rows} kind="Failed safeguard" onOpen={onOpen} />
    </SectionCard>
  );
}
