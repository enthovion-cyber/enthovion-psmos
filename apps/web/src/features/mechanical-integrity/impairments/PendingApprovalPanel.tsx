import type { MiSafeguardImpairment } from '../types/impairment.types';
import { SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { ImpairmentRegisterTable } from './ImpairmentRegisterTable';

export function PendingApprovalPanel({ rows }: { rows?: MiSafeguardImpairment[] | undefined }) {
  const pending = rows?.filter((row) => ['Pending Approval', 'Extension Requested'].includes(String(row.status))) ?? [];
  return <SectionCard title="Pending Approval Panel" description="Requests and extension approvals waiting for authorized decision."><ImpairmentRegisterTable rows={pending.slice(0, 8)} /></SectionCard>;
}
