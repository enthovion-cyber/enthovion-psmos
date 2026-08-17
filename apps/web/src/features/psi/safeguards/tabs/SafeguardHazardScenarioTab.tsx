import type { SafeguardDetail } from '../../types/safeguard.types';
import { SafeguardListPanel } from '../SafeguardPrimitives';
import { SafeguardBarrierMap } from '../SafeguardBarrierMap';

export function SafeguardHazardScenarioTab({ detail }: { detail: SafeguardDetail }) {
  return <div className="space-y-5"><SafeguardBarrierMap hazardLinks={detail.hazardLinks} sourceLinks={detail.sourceLinks} /><SafeguardListPanel title="Hazard / Scenario Controlled" subtitle="Source module, record, scenario, hazard type, cause, consequence, deviation, severity, role, performance, confidence, and notes." rows={detail.hazardLinks} emptyTitle="No hazards linked" emptyMessage="Critical safeguards must link a hazard/scenario before approval." /></div>;
}
