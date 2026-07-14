import { hazopNodeService } from "./hazop-node.service";
import { hazopScenarioService } from "./hazop-scenario.service";

export const hazopWorksheetService = {
  context: hazopNodeService.context,
  nodes: hazopNodeService,
  scenarios: hazopScenarioService,
};
