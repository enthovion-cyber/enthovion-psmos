import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Injectable()
export class UserCreationService {
  constructor(private readonly users: UsersService) {}

  create(tenantId: string, actorId: string, dto: CreateUserDto) {
    return this.users.create(tenantId, actorId, dto);
  }
}
