import { TrainingBadge } from './TrainingUi';
export function SopVersionStatusBadge({ current, required, acknowledged }: { current?: string | null; required?: string | null; acknowledged?: string | null }) {
  const mismatch = Boolean(acknowledged && required && acknowledged !== required);
  const label = mismatch ? `Superseded / expected ${required}` : current || required ? `Version ${acknowledged ?? required ?? current}` : 'Version not set';
  return <TrainingBadge tone={mismatch ? 'danger' : 'info'}>{label}</TrainingBadge>;
}
