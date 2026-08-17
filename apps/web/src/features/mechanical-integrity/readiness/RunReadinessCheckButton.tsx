'use client';

import { PrimaryButton } from '../safeguards/SafeguardUiPrimitives';

export function RunReadinessCheckButton({ onRun, disabled, pending }: { onRun: () => void; disabled?: boolean | undefined; pending?: boolean | undefined }) {
  return <PrimaryButton onClick={onRun} disabled={disabled || pending} title={disabled ? 'Assessment is read-only or user lacks permission.' : undefined}>{pending ? 'Running Check...' : 'Run Backend Readiness Check'}</PrimaryButton>;
}
