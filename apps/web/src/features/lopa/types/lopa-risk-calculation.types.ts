export type LopaRiskCalculationFilters = {
  q?: string | undefined;
  status?: string | undefined;
  quick?: string | undefined;
};

export type LopaRiskCalculationData = {
  readOnly: boolean;
  header: Record<string, any>;
  summary: Record<string, any>;
  readiness: {
    percent?: number;
    status?: string;
    checks?: any[];
    blockers?: any[];
    warnings?: any[];
  };
  currentInputs: {
    consequence?: any;
    initiatingEvent?: any;
    conditionalModifiers?: any[];
    creditedIpls?: any[];
    excludedIpls?: any[];
    safeguards?: any[];
    tolerableFrequency?: number;
    methodology?: any;
    inputHash?: string;
  };
  calculation?: any;
  versions: any[];
  assumptions: any[];
  gaps: any[];
  context: {
    readOnly?: boolean;
    methodology?: any;
    statuses?: string[];
    resultStatuses?: string[];
  };
};

export type LopaRiskCalculationActionInput = {
  reason?: string | undefined;
  notes?: string | undefined;
};

export type LopaRiskCalculationAssumptionInput = {
  assumptionType?: string | undefined;
  assumptionTitle: string;
  description?: string | undefined;
  sourceReference?: string | undefined;
  relatedInputType?: string | undefined;
  relatedInputId?: string | undefined;
  impact?: string | undefined;
};

export type LopaRiskCalculationGapInput = {
  gapType: string;
  gapTitle: string;
  gapDescription?: string | undefined;
  severity?: string | undefined;
  closureBlocker?: boolean | undefined;
  status?: string | undefined;
};
