import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../../database/supabase.service';
import { PermissionsService } from '../../permissions/permissions.service';

type JwtPayload = {
  sub: string;
  tenantId: string;
  companyIds?: string[];
  siteIds?: string[];
  roles?: string[];
  permissions?: string[];
  sessionVersion?: number;
  permissionVersion?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly permissionsService: PermissionsService, private readonly db: SupabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('auth.accessSecret') ?? 'development-access-secret'
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.db.single<any>(this.db.from('User').select('id,tenantId,status').eq('id', payload.sub).eq('tenantId', payload.tenantId).maybeSingle()).catch(() => null);
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Your account is disabled. Contact your company admin.');
    const sessionState = await this.db.single<any>(this.db.from('auth_session_states').select('*').eq('user_id', payload.sub).maybeSingle()).catch(() => null);
    if (sessionState?.force_logout) throw new UnauthorizedException(sessionState.force_logout_reason ?? 'Your access changed. Please sign in again.');
    if (sessionState?.session_version && payload.sessionVersion && Number(sessionState.session_version) > payload.sessionVersion) {
      throw new UnauthorizedException(sessionState.stale_reason ?? 'Your session expired because access changed.');
    }
    if (sessionState?.permission_version && payload.permissionVersion && Number(sessionState.permission_version) > payload.permissionVersion) {
      throw new UnauthorizedException(sessionState.stale_reason ?? 'Your permissions changed. Please sign in again.');
    }
    const permissions = payload.permissions?.length
      ? payload.permissions
      : await this.permissionsService.listForUser(payload.sub, payload.tenantId);
    return {
      id: payload.sub,
      tenantId: payload.tenantId,
      companyIds: payload.companyIds ?? [],
      permissions,
      roles: payload.roles ?? [],
      siteIds: payload.siteIds ?? []
    };
  }
}
