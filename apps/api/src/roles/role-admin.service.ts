import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Injectable()
export class RoleAdminService {
  constructor(private readonly roles: RolesService) {}

  list(tenantId: string) {
    return this.roles.list(tenantId);
  }

  create(tenantId: string, actorId: string, dto: CreateRoleDto) {
    return this.roles.create(tenantId, actorId, dto);
  }

  update(tenantId: string, actorId: string, id: string, dto: UpdateRoleDto) {
    return this.roles.update(tenantId, actorId, id, dto);
  }
}
