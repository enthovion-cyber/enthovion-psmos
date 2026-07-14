import type { LopaOwnerProfile, LopaStudy } from './lopa.types';

export type LopaDetailStudy = LopaStudy & {
  description?: string | null;
  sourceModule?: string | null;
  sourceRecordId?: string | null;
  sourceSnapshots?: any[];
  consequences?: any[];
  initiatingEvents?: any[];
  importedSafeguards?: any[];
  teamMembers?: any[];
  history?: any[];
  ownerProfile?: LopaOwnerProfile | null;
  createdAt?: string;
  tags?: string[];
};

export type LopaDetailUpdate = {
  title?: string;
  description?: string;
  studyType?: string;
  priority?: string;
  ownerId?: string;
  facilitatorId?: string;
  dueDate?: string;
  revalidationDueDate?: string;
  confidentialityLevel?: string;
  tags?: string[];
  notes?: string;
};
