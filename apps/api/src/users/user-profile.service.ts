import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Injectable()
export class UserProfileService {
  constructor(private readonly users: UsersService) {}

  get(userId: string) {
    return this.users.getProfile(userId);
  }

  update(tenantId: string, actorId: string, dto: UpdateProfileDto) {
    return this.users.updateOwnProfile(tenantId, actorId, dto);
  }
}
