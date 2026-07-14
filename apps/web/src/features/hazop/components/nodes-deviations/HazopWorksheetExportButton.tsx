"use client";

import { FileDown } from "lucide-react";
import type { HazopNodeListItem } from "../../types/hazop-node.types";
import type { HazopScenarioRow } from "../../types/hazop-scenario.types";

export function HazopWorksheetExportButton({ study, node, scenarios }: { study: any; node?: HazopNodeListItem | null; scenarios: HazopScenarioRow[] }) {
  const exportCsv = () => {
    const rows = [
      ["Study", study.study_number ?? study.id, study.title ?? ""],
      ["Node", node?.node_number ?? "", node?.title ?? ""],
      [],
      ["#", "Guideword", "Parameter", "Deviation", "Cause", "Consequence", "Safeguards", "Severity", "Likelihood", "Risk", "Recommendation Required", "LOPA Required", "Owner", "Status", "Last Updated"],
      ...scenarios.map((scenario, index) => [
        scenario.row_number ?? index + 1,
        scenario.guideword ?? "",
        scenario.parameter ?? "",
        scenario.deviation_text ?? "",
        scenario.cause ?? "",
        scenario.consequence ?? "",
        scenario.existing_safeguards ?? "",
        scenario.severity ?? "",
        scenario.likelihood ?? "",
        scenario.risk_level ?? "",
        scenario.recommendation_required ? "Yes" : "No",
        scenario.lopa_required ? "Yes" : "No",
        scenario.owner_id ?? "",
        scenario.status ?? "",
        scenario.updated_at ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${study.study_number ?? "hazop"}-${node?.node_number ?? "worksheet"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return <button type="button" className="btn-secondary" onClick={exportCsv}><FileDown size={14} /> Export Worksheet</button>;
}
