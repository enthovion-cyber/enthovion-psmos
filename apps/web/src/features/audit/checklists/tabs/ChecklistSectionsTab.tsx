import { ChecklistTabTable } from "./ChecklistTabTable";
export const ChecklistSectionsTab = ({ detail }: { detail: any }) => (
  <ChecklistTabTable title="Sections" rows={detail.sections} />
);
