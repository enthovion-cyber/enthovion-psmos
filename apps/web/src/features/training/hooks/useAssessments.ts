import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '../services/assessment.service';

export function useAssessmentDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'assessments', 'dashboard', filters], queryFn: () => assessmentService.dashboard(filters) });
}

export function useAssessments(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'assessments', 'library', filters], queryFn: () => assessmentService.library(filters) });
}

export function useAssessmentAssignments(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'assessments', 'assignments', filters], queryFn: () => assessmentService.assignments(filters) });
}
