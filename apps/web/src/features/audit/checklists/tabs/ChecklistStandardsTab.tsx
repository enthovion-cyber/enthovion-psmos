import { ChecklistTabTable } from "./ChecklistTabTable";
export const ChecklistStandardsTab = ({ detail }: { detail: any }) => (
  <ChecklistTabTable title="Standards / Regulations" rows={detail.standards} />
);
