import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthInvitationAcceptanceService {
  constructor(private readonly users: UsersService) {}

  accept(token: string, displayName: string, password: string) {
    return this.users.acceptInvitationToken(token, displayName, password);
  }
}
