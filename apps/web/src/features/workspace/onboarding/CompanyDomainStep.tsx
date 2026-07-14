import type { FoundationInput } from '@/services/foundation.service';
import { Step } from './CompanyWorkspaceStep';
export function CompanyDomainStep({ draft, setDraft }: { draft: FoundationInput; setDraft: (draft: FoundationInput) => void }) {
  return <Step title="Company Domain" fields={[['Domain name', 'domain'], ['Verification method', 'verificationMethod'], ['Domain owner/contact', 'domainOwnerEmail'], ['Notes', 'notes']]} draft={draft} setDraft={setDraft} />;
}
