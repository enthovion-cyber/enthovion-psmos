import { DataPanel } from '../equipment-detail/overview/panel-utils';

export function CalibrationToleranceEvaluationPanel({ evaluations }: { evaluations?: Array<Record<string, unknown>> }) {
  const latest = evaluations?.[0] ?? {};
  return <DataPanel title="Calibration Tolerance Evaluation" data={{ finalResult: latest.final_result, failedPointCount: latest.failed_point_count, readinessImpact: latest.readiness_impact }} />;
}

