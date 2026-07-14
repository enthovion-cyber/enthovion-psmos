export function HazopRiskMatrixCell({ severity, likelihood, cell }: { severity: number; likelihood: number; cell?: any }) {
  return (
    <div className="rounded border border-black/20 p-2 font-semibold text-white" style={{ background: cell?.risk_color ?? cell?.color ?? '#334155' }}>
      {cell?.risk_score ?? severity * likelihood}
      <div className="text-[10px] font-normal">{cell?.risk_level ?? cell?.level ?? 'Risk'}</div>
    </div>
  );
}
