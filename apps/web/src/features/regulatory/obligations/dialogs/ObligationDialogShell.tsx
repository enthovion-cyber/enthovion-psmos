import type { ReactNode } from 'react';
import { RegulatoryButton, RegulatoryCard } from '../../shared/RegulatoryUi';

export function ObligationDialogShell({ title, disabledReason, onConfirm, children }: { title: string; disabledReason?: string | null; onConfirm?: () => void; children: ReactNode }) {
  return (
    <RegulatoryCard title={title} action={<RegulatoryButton onClick={onConfirm} disabled={Boolean(disabledReason)} title={disabledReason ?? title}>Save</RegulatoryButton>}>
      {children}
      {disabledReason ? <p className="mt-3 text-sm text-danger">{disabledReason}</p> : null}
    </RegulatoryCard>
  );
}
