export type LopaTeamReadiness = {
  status: string;
  percent?: number;
  checks?: any[];
  blockers?: any[];
  warnings?: any[];
};
