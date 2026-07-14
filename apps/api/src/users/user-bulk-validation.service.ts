import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UserBulkValidationService {
  constructor(private readonly users: UsersService) {}

  validate(tenantId: string, actorId: string, jobId: string) {
    return this.users.validateBulkJob(tenantId, actorId, jobId);
  }
}
