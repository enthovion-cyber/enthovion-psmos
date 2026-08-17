import { MocTrainingReadinessStatusBadge } from '../shared/MocTrainingReadinessStatusBadge';
import { TrainingCard } from '../shared/TrainingUi';
import { MiniField, PanelGrid } from './MocTrainingPanelPrimitives';

export function MocTrainingReadinessPanel({ latest }: { latest?: Record<string, any> | null }) {
  return <TrainingCard title="MOC Training Readiness" subtitle="Backend-generated readiness for implementation, closure and startup."><div className="mb-3"><MocTrainingReadinessStatusBadge status={String(latest?.readiness_status ?? 'Not Assessed')} /></div><PanelGrid><MiniField label="Implementation ready" value={latest?.implementation_ready} /><MiniField label="Closure ready" value={latest?.closure_ready} /><MiniField label="Startup ready" value={latest?.startup_ready} /><MiniField label="Open blockers" value={Array.isArray(latest?.blockers_json) ? latest?.blockers_json.length : latest?.open_blocker_count} /><MiniField label="Evaluated at" value={latest?.evaluated_at} /><MiniField label="Evaluated by" value={latest?.evaluated_by} /></PanelGrid></TrainingCard>;
}
