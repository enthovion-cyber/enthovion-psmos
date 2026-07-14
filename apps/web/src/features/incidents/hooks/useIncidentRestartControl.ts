import { useIncidentImmediateActions } from './useIncidentImmediateActions';
export function useIncidentRestartControl(id: string) { return useIncidentImmediateActions(id); }
