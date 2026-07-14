import { Injectable } from '@nestjs/common';
import { MocImpactAssessmentService } from './moc-impact-assessment.service';

@Injectable()
export class MocImpactAnswerService {
  constructor(private readonly impact: MocImpactAssessmentService) {}

  list(tenantId: string, mocId: string, scope: any) {
    return this.impact.getAnswers(tenantId, mocId, scope);
  }

  save(tenantId: string, actorId: string, mocId: string, payload: Record<string, any>, scope: any) {
    return this.impact.saveAnswers(tenantId, actorId, mocId, payload, scope);
  }
}
