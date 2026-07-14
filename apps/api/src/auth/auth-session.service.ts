import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

export type AuthSessionState = {
  id: string;
  user_id: string;
  company_id?: string | null;
  active_session_id?: string | null;
  session_version: number;
  permission_version: number;
  force_logout: boolean;
  force_logout_reason?: string | null;
  stale_reason?: string | null;
  last_seen_at?: string | null;
};

@Injectable()
export class AuthSessionService {
  constructor(private readonly db: SupabaseService) {}

  async touch(userId: string, companyId?: string | null): Promise<AuthSessionState> {
    const existing = await this.state(userId);
    const now = new Date().toISOString();
    if (!existing) {
      return this.db.single<any>(this.db.from('auth_session_states').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        company_id: companyId ?? null,
        active_session_id: crypto.randomUUID(),
        session_version: 1,
        permission_version: 1,
        force_logout: false,
        last_seen_at: now,
        updated_at: now
      }).select().single()).catch(() => ({
        id: crypto.randomUUID(),
        user_id: userId,
        company_id: companyId ?? null,
        active_session_id: crypto.randomUUID(),
        session_version: 1,
        permission_version: 1,
        force_logout: false,
        last_seen_at: now
      }));
    }
    return this.db.single<any>(this.db.from('auth_session_states').update({ last_seen_at: now, force_logout: false, force_logout_reason: null, stale_reason: null, updated_at: now }).eq('user_id', userId).select().single()).catch(() => existing);
  }

  async state(userId: string): Promise<AuthSessionState | null> {
    return this.db.single<any>(this.db.from('auth_session_states').select('*').eq('user_id', userId).maybeSingle()).catch(() => null);
  }

  async markStale(userId: string, reason: string) {
    const existing = await this.state(userId);
    if (!existing) return null;
    return this.db.single(this.db.from('auth_session_states').update({
      session_version: Number(existing.session_version ?? 1) + 1,
      permission_version: Number(existing.permission_version ?? 1) + 1,
      force_logout: true,
      force_logout_reason: reason,
      stale_reason: reason,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId).select().single()).catch(() => null);
  }

  async validate(userId: string, sessionVersion?: number, permissionVersion?: number) {
    const state = await this.state(userId);
    if (!state) return { valid: true, state: null };
    if (state.force_logout) return { valid: false, reason: state.force_logout_reason ?? 'Session was revoked', state };
    if (sessionVersion !== undefined && Number(state.session_version ?? 1) > sessionVersion) return { valid: false, reason: state.stale_reason ?? 'Session is stale', state };
    if (permissionVersion !== undefined && Number(state.permission_version ?? 1) > permissionVersion) return { valid: false, reason: state.stale_reason ?? 'Permissions changed', state };
    return { valid: true, state };
  }
}
