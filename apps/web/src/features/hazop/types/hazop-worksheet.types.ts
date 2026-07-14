import type { ReactNode } from "react";
import type { HazopNodeListItem } from "./hazop-node.types";
import type { HazopScenarioRow } from "./hazop-scenario.types";

export type HazopWorksheetActions = {
  onOpen: (scenario: HazopScenarioRow) => void;
  onEdit: (scenario: HazopScenarioRow) => void;
  onAddRecommendation: (scenario: HazopScenarioRow) => void;
  onAddSafeguard: (scenario: HazopScenarioRow) => void;
  onRankRisk: (scenario: HazopScenarioRow) => void;
  onMarkLopa: (scenario: HazopScenarioRow) => void;
  onDuplicate: (scenario: HazopScenarioRow) => void;
  onDelete: (scenario: HazopScenarioRow) => void;
};

export type HazopNodesDeviationsLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
  drawer?: ReactNode;
};

export type HazopSelectedNodeContext = {
  node: HazopNodeListItem;
  scenarios: HazopScenarioRow[];
};
