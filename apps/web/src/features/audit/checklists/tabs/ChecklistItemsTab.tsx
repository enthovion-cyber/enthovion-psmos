import { ChecklistTabTable } from "./ChecklistTabTable";
export const ChecklistItemsTab = ({ detail }: { detail: any }) => (
  <ChecklistTabTable title="Items / Questions" rows={detail.items} />
);
