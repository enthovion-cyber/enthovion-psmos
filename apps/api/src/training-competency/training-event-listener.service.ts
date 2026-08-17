import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TrainingCrossModuleSyncService } from './training-cross-module-sync.service';

@Injectable()
export class TrainingEventListenerService {
  constructor(private readonly sync: TrainingCrossModuleSyncService) {}
  onTrainingChange(user: RequestUser, event: Record<string, any>) {
    return this.sync.record(user, { ...event, syncType: event.syncType ?? 'Training Change Event' });
  }
}
