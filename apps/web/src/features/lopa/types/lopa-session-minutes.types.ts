export type LopaSessionMinutesInput = {
  minutesSummary?: string;
  discussionNotes?: string;
  keyDecisionsSummary?: string;
  assumptionsSummary?: string;
  deferredItemsSummary?: string;
  concernsSummary?: string;
  followUpRequired?: boolean;
  preparedBy?: string;
  preparedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reason?: string;
};

export type LopaSessionDecisionInput = {
  decisionTitle: string;
  decisionDescription?: string;
  relatedTab?: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  decisionType?: string;
  decisionOutcome?: string;
  decisionOwnerMemberId?: string;
  evidenceReference?: string;
  actionRequired?: boolean;
  notes?: string;
};
