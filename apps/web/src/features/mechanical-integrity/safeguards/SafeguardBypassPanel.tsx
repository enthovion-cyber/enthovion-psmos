import type { MiSafeguardRow } from '../types/safeguard-common.types';
import { SafeguardRegisterTable, SectionCard } from './SafeguardUiPrimitives';

export function SafeguardBypassPanel({ rows, onOpen }: { rows?: MiSafeguardRow[]; onOpen?: (row: MiSafeguardRow) => void }) {
  return (
    <SectionCard title="Bypass / Inhibit / Override Watchlist" description="Active or recent bypass foundations that affect readiness, PSSR, MOC, and startup decisions.">
      <SafeguardRegisterTable rows={rows} kind="Bypassed safeguard" onOpen={onOpen} />
    </SectionCard>
  );
}
