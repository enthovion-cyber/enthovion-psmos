import type { FoundationInput } from '@/services/foundation.service';
import { Step } from './CompanyWorkspaceStep';
export function CompanyProfileStep({ draft, setDraft }: { draft: FoundationInput; setDraft: (draft: FoundationInput) => void }) {
  return <Step title="Company Profile" fields={[['Legal company name', 'legalName'], ['Display name', 'displayName'], ['Logo URL', 'logoUrl'], ['Currency', 'currency'], ['Address', 'address'], ['Phone', 'phone'], ['Website', 'website'], ['Status', 'status']]} draft={draft} setDraft={setDraft} />;
}
