import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';

const groups = ['training.dashboard.*', 'training.workforce.*', 'training.matrix.*', 'training.competency.*', 'training.required.*', 'training.records.*', 'training.certifications.*', 'training.assessments.*', 'training.sop_ack.*', 'training.moc.*', 'training.pssr.*', 'training.ptw_authorization.*', 'training.reports.*', 'training.review.*', 'training.history.*', 'training.settings.*'];

@Injectable()
export class TrainingPermissionAuditService {
  audit(user: RequestUser) {
    const permissions = new Set(user.permissions ?? []);
    return groups.map((group) => {
      const prefix = group.replace('.*', '.');
      const granted = [...permissions].filter((permission) => permission.startsWith(prefix));
      return { group, status: granted.length ? 'Covered' : 'Missing / Not Assigned', grantedCount: granted.length, granted };
    });
  }
}
