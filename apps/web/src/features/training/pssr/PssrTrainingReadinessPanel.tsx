import { PssrTrainingReadinessStatusBadge } from '../shared/PssrTrainingReadinessStatusBadge';
import { TrainingCard } from '../shared/TrainingUi';
import { MiniField, PanelGrid } from './PssrTrainingPanelPrimitives';

export function PssrTrainingReadinessPanel({ latest }: { latest?: Record<string, any> | null }) {
  return <TrainingCard title="PSSR Training Readiness" subtitle="Backend-generated readiness for approval, handover and startup."><div className="mb-3"><PssrTrainingReadinessStatusBadge status={String(latest?.readiness_status ?? 'Not Assessed')} /></div><PanelGrid><MiniField label="Approval ready" value={latest?.approval_ready} /><MiniField label="Handover ready" value={latest?.handover_ready} /><MiniField label="Startup ready" value={latest?.startup_ready} /><MiniField label="Open blockers" value={Array.isArray(latest?.blockers_json) ? latest?.blockers_json.length : latest?.open_blocker_count} /><MiniField label="Evaluated at" value={latest?.evaluated_at} /><MiniField label="Evaluated by" value={latest?.evaluated_by} /></PanelGrid></TrainingCard>;
}

