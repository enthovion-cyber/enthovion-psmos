import { BadRequestException, Body, Controller, Get, GoneException, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthPostCallbackDto, CompleteWorkspaceDto, ResendSignupVerificationDto, SignupEmailDto, SignupStatusQueryDto, StartCheckoutDto, StartTrialDto } from './dto/signup.dto';
import { SignupService } from './signup.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly signup: SignupService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: RequestLike) {
    return this.auth.login(dto.email, dto.password, requestMeta(req));
  }

  @Public()
  @Post('register')
  register(@Body() _dto: RegisterDto) {
    throw new GoneException('Register is deprecated. Use Sign Up at /signup or POST /auth/signup/email.');
  }

  @Public()
  @Post('signup/email')
  signupEmail(@Body() dto: SignupEmailDto, @Req() req: RequestLike) {
    return this.signup.email(dto, requestMeta(req));
  }

  @Public()
  @Post('signup/resend-verification')
  resendSignupVerification(@Body() dto: ResendSignupVerificationDto, @Req() req: RequestLike) {
    return this.signup.resendVerification(dto.email, requestMeta(req));
  }

  @Public()
  @Get('signup/status')
  signupStatus(@Query() query: SignupStatusQueryDto) {
    return this.signup.status(query);
  }

  @Public()
  @Get('signup/next-step')
  signupNextStep(@Query() query: SignupStatusQueryDto) {
    return this.signup.nextStep(query);
  }

  @Public()
  @Post('signup/complete-workspace')
  completeSignupWorkspace(@Body() dto: CompleteWorkspaceDto, @Req() req: RequestLike) {
    return this.signup.completeWorkspace(dto, requestMeta(req));
  }

  @Public()
  @Get('signup/plans')
  signupPlans() {
    return this.signup.plans();
  }

  @Public()
  @Post('signup/start-trial')
  signupStartTrial(@Body() dto: StartTrialDto, @Req() req: RequestLike) {
    return this.signup.startTrial(dto, requestMeta(req));
  }

  @Public()
  @Post('signup/start-checkout')
  signupStartCheckout(@Body() dto: StartCheckoutDto, @Req() req: RequestLike) {
    return this.signup.startCheckout(dto, requestMeta(req));
  }

  @Public()
  @Post('post-callback')
  postCallback(@Body() dto: AuthPostCallbackDto, @Req() req: RequestLike) {
    return this.signup.postCallback(dto, requestMeta(req));
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.auth.acceptInvite(dto.token, dto.displayName, dto.password);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: RequestLike) {
    return this.auth.forgotPassword(dto.email, requestMeta(req));
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: RequestLike) {
    return this.auth.resetPassword(dto.token, dto.password, requestMeta(req));
  }

  @UseGuards(JwtAuthGuard)
  @Post('force-change-password')
  forceChangePassword(@CurrentUser() user: RequestUser, @Body() dto: { currentPassword?: string; newPassword: string; confirmPassword?: string }, @Req() req: RequestLike) {
    return this.auth.forceChangePassword(user.tenantId, user.id, dto.currentPassword, dto.newPassword, requestMeta(req));
  }

  @Public()
  @Get('google/start')
  googleStart() {
    return this.auth.googleStart();
  }

  @Public()
  @Get('google/callback')
  googleCallback(@Query() query: Record<string, string>) {
    return { ...this.auth.googleCallback(), query: Object.keys(query ?? {}) };
  }

  @Public()
  @Post('google/complete')
  googleComplete(@Body() dto: { email: string; providerUserId?: string; displayName?: string; avatarUrl?: string }, @Req() req: RequestLike) {
    void dto;
    void req;
    throw new BadRequestException('Manual Google completion is disabled. Use the Supabase OAuth callback flow.');
  }

  @Public()
  @Post('report-suspicious-login')
  reportSuspiciousLogin(@Body() dto: { email?: string; message?: string; eventId?: string }, @Req() req: RequestLike) {
    return this.auth.reportSuspiciousLogin(dto, requestMeta(req));
  }

  @UseGuards(JwtAuthGuard)
  @Post('google/link-account')
  googleLinkAccount(@CurrentUser() user: RequestUser, @Body() dto: { email: string; providerUserId?: string }) {
    return { linked: true, userId: user.id, provider: 'google', email: dto.email };
  }

  @UseGuards(JwtAuthGuard)
  @Post('google/unlink-account')
  googleUnlinkAccount(@CurrentUser() user: RequestUser) {
    return { unlinked: true, userId: user.id, provider: 'google' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.auth.me(user.id, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/bootstrap')
  bootstrap(@CurrentUser() user: RequestUser) {
    return this.signup.bootstrap(user.id, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/onboarding-status')
  onboardingStatus(@CurrentUser() user: RequestUser) {
    return this.signup.onboardingStatus(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  session(@CurrentUser() user: RequestUser) {
    return this.auth.session(user.id, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('validate-session')
  validateSession(@CurrentUser() user: RequestUser, @Body() dto: { sessionVersion?: number; permissionVersion?: number }) {
    return this.auth.validateSession(user.id, user.tenantId, dto.sessionVersion, dto.permissionVersion);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh-session')
  refreshSession(@CurrentUser() user: RequestUser) {
    return this.auth.refreshSession(user.id, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('force-logout-current')
  forceLogoutCurrent(@CurrentUser() user: RequestUser, @Body('reason') reason?: string) {
    return this.auth.forceLogoutCurrent(user.id, user.tenantId, reason);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: RequestUser, @Req() req: RequestLike) {
    return this.auth.logout(user.id, user.tenantId, requestMeta(req));
  }
}

type RequestLike = {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
};

function requestMeta(req: RequestLike) {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  const ipAddress = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor ?? req.ip;
  const userAgent = req.headers?.['user-agent'];
  return {
    ...(ipAddress ? { ipAddress } : {}),
    ...(typeof userAgent === 'string' ? { userAgent } : {})
  };
}
