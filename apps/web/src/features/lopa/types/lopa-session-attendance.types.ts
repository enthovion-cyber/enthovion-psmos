export type LopaSessionAttendanceInput = {
  teamMemberId: string;
  requiredAttendee?: boolean;
  attendanceStatus: string;
  attendedFrom?: string;
  attendedTo?: string;
  delegateMemberId?: string;
  delegateName?: string;
  absenceReason?: string;
  notes?: string;
};
