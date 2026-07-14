export type IncidentClosure = {
  readyForClosure?: boolean;
  closureDecision?: string;
  closureType?: string;
  closureReason?: string;
  closureSummary?: string;
  closedBy?: string;
  closedAt?: string;
  exceptionReason?: string;
  exceptionApprover?: string;
};
