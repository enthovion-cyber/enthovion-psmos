import { DataPanel } from '../equipment-detail/overview/panel-utils';

export function PmFindingPanel({ findings }: { findings?: Array<Record<string, unknown>> }) {
  return <DataPanel title="PM Findings" data={{ totalFindings: findings?.length ?? 0, criticalFindings: findings?.filter((item) => /critical/i.test(String(item.severity ?? ''))).length ?? 0 }} />;
}

