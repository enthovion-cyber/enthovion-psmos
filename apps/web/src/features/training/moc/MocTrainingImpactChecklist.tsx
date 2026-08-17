import { TrainingCard, TrainingEmptyState } from '../shared/TrainingUi';
import { MiniField, PanelGrid } from './MocTrainingPanelPrimitives';

export function MocTrainingImpactChecklist({ latest }: { latest?: Record<string, any> | null }) {
  if (!latest) return <TrainingCard title="Impact Checklist"><TrainingEmptyState title="No impact decision" message="Run the backend MOC training impact check to generate checklist status." /></TrainingCard>;
  return <TrainingCard title="Impact Checklist" subtitle="SOP, PSI, task, PTW/PSSR and risk-ranking signals from the backend impact check."><PanelGrid><MiniField label="Training required" value={latest.training_required} /><MiniField label="SOP updated" value={latest.sop_updated} /><MiniField label="PSI changed" value={latest.psi_changed} /><MiniField label="Role/task changed" value={latest.role_task_changed} /><MiniField label="PTW role affected" value={latest.ptw_role_affected} /><MiniField label="Manual review required" value={latest.manual_review_required} /></PanelGrid></TrainingCard>;
}
