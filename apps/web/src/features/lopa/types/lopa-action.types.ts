export type LopaActionInput = {
  title: string;
  description: string;
  ownerId: string;
  priority: string;
  dueDate: string;
  recommendationId?: string | undefined;
  gapId?: string | undefined;
  departmentId?: string | undefined;
  equipmentId?: string | undefined;
  blocking?: boolean | undefined;
  evidenceRequired?: boolean | undefined;
  verificationRequired?: boolean | undefined;
};

export type LinkExistingLopaActionInput = {
  actionId: string;
  recommendationId?: string | undefined;
  relationshipType?: string | undefined;
  blocking?: boolean | undefined;
};
