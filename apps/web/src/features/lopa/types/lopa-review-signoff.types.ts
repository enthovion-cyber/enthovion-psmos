export type LopaReviewFilters = {
  q?: string;
  role?: string;
  decision?: string;
  signatureStatus?: string;
  commentStatus?: string;
  blocking?: string;
};

export type LopaReviewParticipantInput = {
  userId: string;
  reviewRole: string;
  discipline?: string;
  requiredReviewer?: boolean;
  approver?: boolean;
  signatureRequired?: boolean;
  reviewSequence?: number;
  dueDate?: string;
  notes?: string;
  reason?: string;
};

export type LopaReviewCommentInput = {
  title: string;
  commentText: string;
  commentType?: string;
  relatedTab?: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  severity?: string;
  blocking?: boolean;
  status?: string;
  ownerId?: string;
  dueDate?: string;
  resolutionNotes?: string;
};

export type LopaReviewDecisionInput = {
  reason?: string;
  comments?: string;
  overrideBlockers?: boolean;
  confirmed?: boolean;
  decision?: string;
};

export type LopaReviewSignatureInput = {
  participantId: string;
  signatureMeaning: string;
  authMethod: 'password' | 'pin';
  usernameReentry: string;
  passwordOrPin: string;
  comment?: string;
};

export type LopaReviewSignoffData = {
  header: Record<string, any>;
  summary: { cards: Array<{ key: string; label: string; value: string | number }>; readyForApproval: boolean };
  readiness: any;
  checklist: any[];
  workflow: any;
  participants: any[];
  comments: any[];
  blockers: any[];
  snapshots: any[];
  signatures: any[];
  notifications: any[];
  context: { reviewRoles: string[]; commentTypes: string[]; signatureMeanings: string[]; readOnly: boolean };
  readOnly: boolean;
};
