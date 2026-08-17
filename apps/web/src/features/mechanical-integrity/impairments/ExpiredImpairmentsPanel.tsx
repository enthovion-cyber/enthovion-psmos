import type { MiSafeguardImpairment } from '../types/impairment.types';
import { SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { ImpairmentRegisterTable } from './ImpairmentRegisterTable';

export function ExpiredImpairmentsPanel({ rows }: { rows?: MiSafeguardImpairment[] | undefined }) {
  const expired = rows?.filter((row) => row.status === 'Expired' || /expired|overdue/i.test(String(row.expiryStatus))) ?? [];
  return <SectionCard title="Expired Bypass Panel" description="Expired safeguard bypasses and overdue restoration records."><ImpairmentRegisterTable rows={expired.slice(0, 8)} /></SectionCard>;
}
