import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';
import { hasLocalSession } from '@/services/api';

export function useExecutiveDashboard(scope?: Record<string, unknown>) { return useQuery({ queryKey: ['executive', 'dashboard', scope], queryFn: () => executiveApi.dashboard(scope), refetchOnWindowFocus: false, enabled: hasLocalSession() }); }
export function useExecutiveRefresh(scope?: Record<string, unknown>) { const client = useQueryClient(); return useMutation({ mutationFn: () => executiveApi.refresh(scope), onSuccess: () => void client.invalidateQueries({ queryKey: ['executive'] }) }); }
export function useExecutiveAggregation(scope?: Record<string, unknown>) { const client = useQueryClient(); return useMutation({ mutationFn: () => executiveApi.runAggregation(scope), onSuccess: () => void client.invalidateQueries({ queryKey: ['executive'] }) }); }
export function useExecutiveKpis() { return useQuery({ queryKey: ['executive', 'kpis'], queryFn: () => executiveApi.kpis(), refetchOnWindowFocus: false }); }
export function useExecutiveDefinitions() { return useQuery({ queryKey: ['executive', 'definitions'], queryFn: () => executiveApi.definitions(), refetchOnWindowFocus: false }); }
export function useExecutiveSnapshotRegister() { return useQuery({ queryKey: ['executive', 'snapshots'], queryFn: () => executiveApi.snapshots(), refetchOnWindowFocus: false }); }
export function useExecutiveSettings() { return useQuery({ queryKey: ['executive', 'settings'], queryFn: executiveApi.settings, refetchOnWindowFocus: false }); }
