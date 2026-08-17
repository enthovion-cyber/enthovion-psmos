import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryButton } from '../shared/RegulatoryUi';
import type { RegulatoryObligation } from '../types/regulatory-obligation.types';

export function RegulatoryObligationDetailHeader({ obligation, obligationId, readOnly, readOnlyReason, onRefresh }: { obligation?: RegulatoryObligation | null | undefined; obligationId: string; readOnly?: boolean | undefined; readOnlyReason?: string | null | undefined; onRefresh: () => void | Promise<unknown> }) {
  return (
    <RegulatoryHeader
      title={obligation?.obligation_title ?? 'Regulatory Obligation'}
      subtitle={`${obligation?.obligation_code ?? 'No code'} - ${obligation?.obligation_reference ?? 'No clause/reference entered'}`}
      action={<RegulatoryButton href={`/regulatory/obligations/${obligationId}/edit`} disabled={readOnly} title={readOnlyReason ?? 'Edit obligation'}>Edit</RegulatoryButton>}
      onRefresh={onRefresh}
    />
  );
}
