import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { criticalAlarmService } from '../services/critical-alarm.service';

export function useCriticalAlarms(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'critical-alarms', equipmentId ?? 'all', filters], queryFn: () => criticalAlarmService.registry(filters, equipmentId) });
}

export function useCriticalAlarmDetail(alarmId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'critical-alarms', alarmId], queryFn: () => criticalAlarmService.get(alarmId as string), enabled: Boolean(alarmId) });
}

export function useCriticalAlarmMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'critical-alarms'] });
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => criticalAlarmService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ alarmId, input }: { alarmId: string; input: Record<string, unknown> }) => criticalAlarmService.update(alarmId, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: ({ alarmId, reason }: { alarmId: string; reason: string }) => criticalAlarmService.archive(alarmId, reason), onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: ({ alarmId, reason }: { alarmId: string; reason: string }) => criticalAlarmService.reactivate(alarmId, reason), onSuccess: invalidate })
  };
}
