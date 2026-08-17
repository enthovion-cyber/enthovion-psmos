import { ChecklistTabTable } from "./ChecklistTabTable";
export const ChecklistModulesTab = ({ detail }: { detail: any }) => (
  <ChecklistTabTable title="Modules Covered" rows={detail.modules} />
);
