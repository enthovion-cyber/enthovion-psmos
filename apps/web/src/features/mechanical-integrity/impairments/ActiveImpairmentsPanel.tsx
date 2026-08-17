import type { MiSafeguardImpairment } from '../types/impairment.types';
import { SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { ImpairmentRegisterTable } from './ImpairmentRegisterTable';

export function ActiveImpairmentsPanel({ rows }: { rows?: MiSafeguardImpairment[] | undefined }) {
  const active = rows?.filter((row) => ['Active', 'Expiring Soon', 'Expired', 'Extension Requested', 'Pending Restoration'].includes(String(row.status))) ?? [];
  return <SectionCard title="Active Bypass / Impairment Panel" description="Active, expiring, expired, extension, and restoration-pending safeguard impairments."><ImpairmentRegisterTable rows={active.slice(0, 8)} /></SectionCard>;
}
