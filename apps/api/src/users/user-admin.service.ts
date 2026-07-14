import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Injectable()
export class UserAdminService {
  constructor(private readonly users: UsersService) {}

  list(tenantId: string) {
    return this.users.list(tenantId);
  }

  create(tenantId: string, actorId: string, dto: CreateUserDto) {
    return this.users.create(tenantId, actorId, dto);
  }

  get(tenantId: string, id: string) {
    return this.users.getById(tenantId, id);
  }
}
