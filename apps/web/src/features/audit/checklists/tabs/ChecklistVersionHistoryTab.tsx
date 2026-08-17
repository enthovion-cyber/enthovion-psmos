import { ChecklistTabTable } from "./ChecklistTabTable";
export const ChecklistVersionHistoryTab = ({ detail }: { detail: any }) => (
  <ChecklistTabTable title="Version History" rows={detail.versions} />
);
