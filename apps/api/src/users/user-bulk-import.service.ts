import { Injectable } from '@nestjs/common';
import { BulkImportUserRowDto } from './dto/bulk-import-users.dto';
import { UsersService } from './users.service';

@Injectable()
export class UserBulkImportService {
  constructor(private readonly users: UsersService) {}

  createJob(tenantId: string, actorId: string, fileName: string | undefined, users: BulkImportUserRowDto[]) {
    return this.users.createBulkJob(tenantId, actorId, { ...(fileName ? { fileName } : {}), users });
  }
}
