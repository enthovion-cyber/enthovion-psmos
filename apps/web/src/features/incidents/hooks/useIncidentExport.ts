import { useMutation } from '@tanstack/react-query';
import { incidentRegisterService } from '../services/incident-register.service';
export function useIncidentExport() {
  return { register: useMutation({ mutationFn: incidentRegisterService.exportRegister }), psm: useMutation({ mutationFn: incidentRegisterService.exportPsm }), highPotential: useMutation({ mutationFn: incidentRegisterService.exportHighPotential }), overdue: useMutation({ mutationFn: incidentRegisterService.exportOverdue }) };
}
