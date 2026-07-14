export function mocRiskScore(safety: number, environmental: number, production: number): number {
  return Math.max(1, Math.min(9, safety + environmental + production));
}

export function riskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score <= 2) return 'LOW';
  if (score <= 4) return 'MEDIUM';
  if (score <= 7) return 'HIGH';
  return 'CRITICAL';
}
