import { ChecklistTabTable } from "./ChecklistTabTable";
export const ChecklistAssignmentsTab = ({ detail }: { detail: any }) => (
  <ChecklistTabTable
    title="Assigned Programs / Plans"
    rows={detail.assignments}
  />
);
