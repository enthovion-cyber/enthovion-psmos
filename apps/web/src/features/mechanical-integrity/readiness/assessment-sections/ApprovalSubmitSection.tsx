'use client';

import { ActionButton, MissingDataList, PrimaryButton, SectionCard } from '../../safeguards/SafeguardUiPrimitives';

type Props = {
  missing?: string[];
  saving?: boolean;
  submitting?: boolean;
  disabledReason?: string;
  canSubmit?: boolean;
  onBack: () => void;
  onSave: () => void;
  onSubmit?: () => void;
};

export function ApprovalSubmitSection({ missing, saving, submitting, disabledReason, canSubmit, onBack, onSave, onSubmit }: Props) {
  return (
    <SectionCard title="7. Approval & Submit" description="Final backend validation happens here. Approved assessments become read-only and update equipment readiness.">
      <MissingDataList items={missing} />
      <div className="mt-5 flex flex-wrap gap-2">
        <PrimaryButton onClick={onSave} disabled={Boolean(disabledReason) || saving} title={disabledReason}>{saving ? 'Saving...' : 'Save Assessment'}</PrimaryButton>
        <ActionButton onClick={onSubmit} disabled={!canSubmit || submitting} title={!canSubmit ? 'Save and run readiness check before submitting.' : undefined}>{submitting ? 'Submitting...' : 'Submit for Approval'}</ActionButton>
        <ActionButton onClick={onBack}>Cancel</ActionButton>
      </div>
    </SectionCard>
  );
}
