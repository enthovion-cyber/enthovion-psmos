import { Injectable } from '@nestjs/common';
import { InviteUserDto } from './dto/invite-user.dto';
import { UsersService } from './users.service';

@Injectable()
export class UserInvitationService {
  constructor(private readonly users: UsersService) {}

  invite(tenantId: string, actorId: string, dto: InviteUserDto) {
    return this.users.invite(tenantId, actorId, dto);
  }

  accept(token: string, displayName: string, password: string) {
    return this.users.acceptInvitationToken(token, displayName, password);
  }
}
