import { z } from 'zod';

export const hazopSessionSchema = z.object({
  title: z.string().min(2, 'Session title is required'),
  sessionType: z.string().default('HAZOP worksheet session'),
  description: z.string().optional().or(z.literal('')),
  sessionDate: z.string().optional().or(z.literal('')),
  startTime: z.string().optional().or(z.literal('')),
  endTime: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  meetingLink: z.string().optional().or(z.literal('')),
  facilitatorId: z.string().optional().or(z.literal('')),
  scribeId: z.string().optional().or(z.literal('')),
  plannedNodeIds: z.array(z.string()).default([]),
  agenda: z.string().optional().or(z.literal('')),
  status: z.string().default('Planned')
});

export const hazopAttendanceSchema = z.object({
  teamMemberId: z.string().optional().or(z.literal('')),
  userId: z.string().optional().or(z.literal('')),
  required: z.boolean().optional(),
  attendanceStatus: z.enum(['Present', 'Absent', 'Partial', 'Excused', 'Substitute Attended', 'Not Required']),
  joinTime: z.string().optional().or(z.literal('')),
  leaveTime: z.string().optional().or(z.literal('')),
  durationMinutes: z.number().optional(),
  substituteName: z.string().optional().or(z.literal('')),
  substituteUserId: z.string().optional().or(z.literal('')),
  comment: z.string().optional().or(z.literal(''))
});

export const hazopMinutesSchema = z.object({
  summary: z.string().optional().or(z.literal('')),
  discussionNotes: z.string().optional().or(z.literal('')),
  nodesReviewed: z.array(z.string()).default([]),
  keyDeviationsDiscussed: z.string().optional().or(z.literal('')),
  risksEscalated: z.string().optional().or(z.literal('')),
  recommendationsCreated: z.string().optional().or(z.literal('')),
  decisionsMade: z.string().optional().or(z.literal('')),
  openQuestions: z.string().optional().or(z.literal('')),
  nextSessionPlan: z.string().optional().or(z.literal('')),
  reviewedBy: z.string().optional().or(z.literal('')),
  approvedBy: z.string().optional().or(z.literal('')),
  status: z.string().default('Draft')
});

export const hazopDecisionSchema = z.object({
  decisionTitle: z.string().min(2, 'Decision title is required'),
  decisionDescription: z.string().optional().or(z.literal('')),
  decisionType: z.string().default('Other'),
  nodeId: z.string().optional().or(z.literal('')),
  scenarioId: z.string().optional().or(z.literal('')),
  recommendationId: z.string().optional().or(z.literal('')),
  ownerId: z.string().optional().or(z.literal('')),
  decisionDate: z.string().optional().or(z.literal(''))
});

export const hazopSessionActionSchema = z.object({
  actionId: z.string().optional().or(z.literal('')),
  title: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  ownerId: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  priority: z.string().default('Medium'),
  nodeId: z.string().optional().or(z.literal('')),
  scenarioId: z.string().optional().or(z.literal('')),
  requiredBeforeSessionCompletion: z.boolean().default(false),
  evidenceRequired: z.boolean().default(false),
  verificationRequired: z.boolean().default(false)
});
