import type { FoundationInput } from '@/services/foundation.service';
import { Step } from './CompanyWorkspaceStep';
export function OrganizationStructureStep({ draft, setDraft }: { draft: FoundationInput; setDraft: (draft: FoundationInput) => void }) {
  return <Step title="Departments / Process Units / Areas" fields={[['Department name', 'departmentName'], ['Department description', 'departmentDescription'], ['Unit name', 'unitName'], ['Unit code', 'unitCode'], ['Area name', 'areaName'], ['Area code', 'areaCode']]} draft={draft} setDraft={setDraft} />;
}
