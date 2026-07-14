import type { FoundationInput } from '@/services/foundation.service';
import { Step } from './CompanyWorkspaceStep';
export function SitesStep({ draft, setDraft }: { draft: FoundationInput; setDraft: (draft: FoundationInput) => void }) {
  return <Step title="Site / Plant Setup" fields={[['Site name', 'siteName'], ['Site code', 'siteCode'], ['Site country', 'siteCountry'], ['Site timezone', 'siteTimezone'], ['Site manager', 'siteManagerId'], ['Emergency contact', 'emergencyContact']]} draft={draft} setDraft={setDraft} />;
}
