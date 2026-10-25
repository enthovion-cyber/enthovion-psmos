import { Injectable } from '@nestjs/common';

@Injectable()
export class ExecutivePsmElementScoreStatusService {
  getStatus(score: number | null): string {
    if (score == null) return 'Insufficient Data';
    if (score >= 90) return 'Healthy';
    if (score >= 75) return 'Monitor';
    if (score >= 60) return 'Attention Required';
    if (score >= 40) return 'High Risk';
    return 'Critical';
  }
}
