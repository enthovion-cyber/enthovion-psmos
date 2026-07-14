export type LopaSessionAgendaInput = {
  topic: string;
  description?: string;
  relatedTab?: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  ownerMemberId?: string;
  plannedDurationMinutes?: number;
  status?: string;
  notes?: string;
  sortOrder?: number;
};
