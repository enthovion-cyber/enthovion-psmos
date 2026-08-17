import { MissingDataList, SectionCard } from '../../safeguards/SafeguardUiPrimitives';
export function ReviewSaveSection({ missing }: { missing?: string[] }) {
  return <SectionCard title="Review / Readiness" description="Final review of required data before saving or activating the safeguard."><MissingDataList items={missing} /></SectionCard>;
}
