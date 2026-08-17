export type CriticalityConfig = {
  id: string;
  config_name: string;
  scope: string;
  active: boolean;
  matrix_size: number;
  score_method: string;
  consequence_scale_json: Array<Record<string, unknown>>;
  likelihood_scale_json: Array<Record<string, unknown>>;
  consequence_dimensions_json: Array<Record<string, unknown>>;
  likelihood_dimensions_json: Array<Record<string, unknown>>;
  category_thresholds_json: Array<Record<string, unknown>>;
  review_frequency_json: Record<string, unknown>;
};
