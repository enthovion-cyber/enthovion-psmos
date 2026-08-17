export type TrainingPage<T = Record<string, any>> = { rows: T[]; total: number; page: number; limit: number; lastUpdated?: string };
export type CompetencyProfile = Record<string, any>;
export type CompetencyRequirement = Record<string, any>;
export type CompetencyGap = Record<string, any>;
export type CompetencyAssignment = Record<string, any>;
export type CompetencyEvaluation = Record<string, any>;
export type CompetencyDashboard = Record<string, any>;
