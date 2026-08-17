import { ChecklistTabTable } from "./ChecklistTabTable";
export const ChecklistApplicabilityTab = ({ detail }: { detail: any }) => (
  <ChecklistTabTable title="Applicability Scope" rows={detail.scope} />
);
