import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePsmElementService } from './executive-psm-element.service';

@Injectable()
export class ExecutivePsmElementSnapshotService {
  constructor(private readonly psmElements: ExecutivePsmElementService) {}
  snapshots(user: RequestUser, query: Record<string, any> = {}) {
    return this.psmElements.snapshots(user, query);
  }
  snapshot(user: RequestUser, dto: Record<string, any>) {
    return this.psmElements.snapshot(user, dto);
  }
  detail(user: RequestUser, id: string) {
    return this.psmElements.snapshotDetail(user, id);
  }
  archive(user: RequestUser, id: string, dto: Record<string, any>) {
    return this.psmElements.archiveSnapshot(user, id, dto);
  }
}
