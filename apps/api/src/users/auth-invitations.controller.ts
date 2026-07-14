import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { UsersService } from './users.service';

@ApiTags('auth invitations')
@Controller('auth/invitations')
export class AuthInvitationsController {
  constructor(private readonly users: UsersService) {}

  @Public()
  @Get(':token')
  get(@Param('token') token: string) {
    return this.users.getInvitationByToken(token);
  }

  @Public()
  @Post(':token/accept')
  accept(@Param('token') token: string, @Body() dto: { displayName: string; password: string }) {
    return this.users.acceptInvitationToken(token, dto.displayName, dto.password);
  }

  @Public()
  @Post(':token/accept-google')
  async acceptGoogle(@Param('token') token: string) {
    const invitation = await this.users.getInvitationByToken(token);
    return {
      status: 'google_acceptance_pending_provider',
      message: 'Invitation is valid. Continue with Google sign-in to complete account activation.',
      invitation
    };
  }

  @Public()
  @Post(':token/resend-request')
  async resendRequest(@Param('token') token: string) {
    await this.users.getInvitationByToken(token);
    return {
      success: true,
      message: 'Resend request received. If the invitation can be resent, an administrator will be notified.'
    };
  }
}
