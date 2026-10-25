import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { managementReviewApi } from '../services/executive-management-review.service';
import type {
  ManagementReviewDashboard,
  ManagementReviewPaged,
  ManagementReviewReadiness,
  ManagementReviewFollowUpData,
} from '../types/executive-management-review.types';

export const useManagementReviewDashboard = (params?: Record<string, unknown>) =>
  useQuery<ManagementReviewDashboard>({
    queryKey: ['executive', 'management-review', 'dashboard', params],
    queryFn: () => managementReviewApi.dashboard(params),
  });

export const useManagementReviewContext = (params?: Record<string, unknown>) =>
  useQuery<Record<string, any>>({
    queryKey: ['executive', 'management-review', 'context', params],
    queryFn: () => managementReviewApi.context(params),
  });

export const useManagementReviewRegister = (
  kind: 'cycles' | 'meetings' | 'packages' | 'minutes' | 'decisions' | 'commitments' | 'history',
  params?: Record<string, unknown>
) =>
  useQuery<ManagementReviewPaged | any[]>({
    queryKey: ['executive', 'management-review', kind, params],
    queryFn: () => (managementReviewApi as any)[kind](params),
  });

export const useManagementReviewReadiness = (params?: Record<string, unknown>) =>
  useQuery<ManagementReviewReadiness>({
    queryKey: ['executive', 'management-review', 'readiness', params],
    queryFn: () => managementReviewApi.readiness(params),
  });

export const useManagementReviewCycle = (id: string) =>
  useQuery({
    queryKey: ['executive', 'management-review', 'cycles', id],
    queryFn: () => managementReviewApi.cycle(id),
    enabled: Boolean(id),
  });

export const useManagementReviewMeeting = (id: string) =>
  useQuery({
    queryKey: ['executive', 'management-review', 'meetings', id],
    queryFn: () => managementReviewApi.meeting(id),
    enabled: Boolean(id),
  });

export const useManagementReviewDecision = (id: string) =>
  useQuery({
    queryKey: ['executive', 'management-review', 'decisions', id],
    queryFn: () => managementReviewApi.singleDecision(id),
    enabled: Boolean(id),
  });

export const useManagementReviewCommitment = (id: string) =>
  useQuery({
    queryKey: ['executive', 'management-review', 'commitments', id],
    queryFn: () => managementReviewApi.singleCommitment(id),
    enabled: Boolean(id),
  });

export const useManagementReviewMinutes = (id: string) =>
  useQuery({
    queryKey: ['executive', 'management-review', 'minutes', id],
    queryFn: () => managementReviewApi.singleMinutes(id),
    enabled: Boolean(id),
  });

export const useManagementReviewPackage = (id: string) =>
  useQuery({
    queryKey: ['executive', 'management-review', 'packages', id],
    queryFn: () => managementReviewApi.package(id),
    enabled: Boolean(id),
  });

export const useManagementReviewFollowUp = (params?: Record<string, unknown>) =>
  useQuery<ManagementReviewFollowUpData>({
    queryKey: ['executive', 'management-review', 'follow-up', params],
    queryFn: () => managementReviewApi.followUp(params),
  });

export const useManagementReviewCarryForward = (params?: Record<string, unknown>) =>
  useQuery<ManagementReviewPaged>({
    queryKey: ['executive', 'management-review', 'carried-forward', params],
    queryFn: () => managementReviewApi.carriedForwardList(params),
  });

export const useManagementReviewCalendar = (params?: Record<string, unknown>) =>
  useQuery<any[]>({
    queryKey: ['executive', 'management-review', 'calendar', params],
    queryFn: () => managementReviewApi.calendar(params),
  });

export const useManagementReviewTemplates = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'management-review', 'templates', params],
    queryFn: () => managementReviewApi.templates(params),
  });

export const useManagementReviewSettings = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'management-review', 'settings', params],
    queryFn: () => managementReviewApi.settings(params),
  });

export const useManagementReviewLookups = (kind: string) =>
  useQuery<string[]>({
    queryKey: ['executive', 'lookups', kind],
    queryFn: () => managementReviewApi.lookups(kind),
    staleTime: 5 * 60 * 1000,
  });

export const useManagementReviewMutations = () => {
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['executive', 'management-review'] });
    void client.invalidateQueries({ queryKey: ['executive', 'dashboard'] });
  };

  return {
    // Cycles
    createCycle: useMutation({
      mutationFn: (body: Record<string, unknown>) => managementReviewApi.createCycle(body),
      onSuccess: refresh,
    }),
    updateCycle: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        managementReviewApi.updateCycle(id, body),
      onSuccess: refresh,
    }),
    activateCycle: useMutation({
      mutationFn: (id: string) => managementReviewApi.activateCycle(id),
      onSuccess: refresh,
    }),
    completeCycle: useMutation({
      mutationFn: ({ id, body }: { id: string; body?: Record<string, unknown> }) =>
        managementReviewApi.completeCycle(id, body),
      onSuccess: refresh,
    }),
    reopenCycle: useMutation({
      mutationFn: ({ id, body }: { id: string; body?: Record<string, unknown> }) =>
        managementReviewApi.reopenCycle(id, body),
      onSuccess: refresh,
    }),
    archiveCycle: useMutation({
      mutationFn: ({ id, body }: { id: string; body?: Record<string, unknown> }) =>
        managementReviewApi.archiveCycle(id, body),
      onSuccess: refresh,
    }),

    // Meetings
    createMeeting: useMutation({
      mutationFn: (body: Record<string, unknown>) => managementReviewApi.createMeeting(body),
      onSuccess: refresh,
    }),
    updateMeeting: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        managementReviewApi.updateMeeting(id, body),
      onSuccess: refresh,
    }),
    transitionMeeting: useMutation({
      mutationFn: ({ id, action, body }: { id: string; action: string; body?: Record<string, unknown> }) =>
        managementReviewApi.transitionMeeting(id, action, body),
      onSuccess: refresh,
    }),
    rescheduleMeeting: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        managementReviewApi.rescheduleMeeting(id, body),
      onSuccess: refresh,
    }),
    addParticipant: useMutation({
      mutationFn: ({ meetingId, body }: { meetingId: string; body: Record<string, unknown> }) =>
        managementReviewApi.addParticipant(meetingId, body),
      onSuccess: refresh,
    }),
    recordAttendance: useMutation({
      mutationFn: ({ meetingId, body }: { meetingId: string; body: Record<string, unknown> }) =>
        managementReviewApi.recordAttendance(meetingId, body),
      onSuccess: refresh,
    }),
    addAgendaItem: useMutation({
      mutationFn: ({ meetingId, body }: { meetingId: string; body: Record<string, unknown> }) =>
        managementReviewApi.addAgendaItem(meetingId, body),
      onSuccess: refresh,
    }),

    // Packages
    createPackage: useMutation({
      mutationFn: (body: Record<string, unknown>) => managementReviewApi.createPackage(body),
      onSuccess: refresh,
    }),
    validatePackage: useMutation({
      mutationFn: (id: string) => managementReviewApi.validatePackage(id),
      onSuccess: refresh,
    }),
    generatePackage: useMutation({
      mutationFn: (id: string) => managementReviewApi.generatePackage(id),
      onSuccess: refresh,
    }),
    publishPackage: useMutation({
      mutationFn: (id: string) => managementReviewApi.publishPackage(id),
      onSuccess: refresh,
    }),

    // Minutes
    createMinutes: useMutation({
      mutationFn: ({ meetingId, ...body }: Record<string, unknown>) =>
        managementReviewApi.createMinutes(String(meetingId), body),
      onSuccess: refresh,
    }),
    updateMinutes: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        managementReviewApi.updateMinutes(id, body),
      onSuccess: refresh,
    }),
    submitMinutes: useMutation({
      mutationFn: ({ id, ...body }: Record<string, unknown>) =>
        managementReviewApi.submitMinutes(String(id), body),
      onSuccess: refresh,
    }),
    requestMinutesApproval: useMutation({
      mutationFn: (id: string) => managementReviewApi.requestMinutesApproval(id),
      onSuccess: refresh,
    }),

    // Decisions
    createDecision: useMutation({
      mutationFn: (body: Record<string, unknown>) => managementReviewApi.createDecision(body),
      onSuccess: refresh,
    }),
    updateDecision: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        managementReviewApi.updateDecision(id, body),
      onSuccess: refresh,
    }),
    submitDecision: useMutation({
      mutationFn: (id: string) => managementReviewApi.submitDecision(id),
      onSuccess: refresh,
    }),

    // Commitments
    createCommitment: useMutation({
      mutationFn: (body: Record<string, unknown>) => managementReviewApi.createCommitment(body),
      onSuccess: refresh,
    }),
    updateCommitment: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        managementReviewApi.updateCommitment(id, body),
      onSuccess: refresh,
    }),
    assignCommitment: useMutation({
      mutationFn: ({ id, ownerId, note }: { id: string; ownerId: string; note?: string }) =>
        managementReviewApi.assignCommitment(id, ownerId, note),
      onSuccess: refresh,
    }),
    requestCommitmentVerification: useMutation({
      mutationFn: ({ id, verifierId, criteria }: { id: string; verifierId?: string; criteria?: string }) =>
        managementReviewApi.requestCommitmentVerification(id, verifierId, criteria),
      onSuccess: refresh,
    }),
    createAction: useMutation({
      mutationFn: (id: string) => managementReviewApi.createCommitmentAction(id),
      onSuccess: refresh,
    }),
    carryForward: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        managementReviewApi.carryForward(id, body),
      onSuccess: refresh,
    }),

    // Settings & Templates
    saveSettings: useMutation({
      mutationFn: (body: Record<string, unknown>) => managementReviewApi.saveSettings(body),
      onSuccess: refresh,
    }),
    saveTemplate: useMutation({
      mutationFn: ({ body, id }: { body: Record<string, unknown>; id?: string }) =>
        managementReviewApi.saveTemplate(body, id),
      onSuccess: () => void client.invalidateQueries({ queryKey: ['executive', 'management-review', 'templates'] }),
    }),
  };
};
