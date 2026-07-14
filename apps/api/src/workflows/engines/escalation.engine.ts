import { Injectable } from '@nestjs/common';

@Injectable()
export class EscalationEngine {
  nextLevel(existingLevels: number[]) {
    const max = existingLevels.length ? Math.max(...existingLevels) : 0;
    return Math.min(max + 1, 3);
  }

  reasonFor(stepName: string, dueAt?: string | null) {
    return `${stepName} is overdue${dueAt ? ` since ${new Date(dueAt).toLocaleString('en-US')}` : ''}`;
  }
}
