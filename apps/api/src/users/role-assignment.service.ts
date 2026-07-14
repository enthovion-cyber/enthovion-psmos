import { Injectable } from '@nestjs/common';
import { UserRoleDto } from './dto/user-role.dto';
import { UsersService } from './users.service';

@Injectable()
export class RoleAssignmentService {
  constructor(private readonly users: UsersService) {}

  assign(tenantId: string, actorId: string, userId: string, dto: UserRoleDto) {
    return this.users.assignRole(tenantId, actorId, userId, dto);
  }
}
