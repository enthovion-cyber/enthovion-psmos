import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

const personalDomains = new Set(['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com']);

@Injectable()
export class CompanyDomainAuthService {
  constructor(private readonly db: SupabaseService) {}

  async evaluate(email: string) {
    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    if (!domain || personalDomains.has(domain)) return { allowed: false, domain, reason: 'No workspace found for this email. Ask your company admin to invite you.' };
    const domainRow = await this.db.single<any>(
      this.db.from('CompanyDomain').select('*, company:Company(*), settings:CompanySetting(*)').eq('domain', domain).eq('status', 'ACTIVE').maybeSingle()
    ).catch(() => null);
    if (!domainRow) return { allowed: false, domain, reason: 'No workspace found for this email. Ask your company admin to invite you.' };
    if (domainRow.verificationStatus !== 'VERIFIED') return { allowed: false, domain, company: domainRow.company, reason: 'Google sign-in is not enabled for this workspace domain.' };
    if (!domainRow.allowGoogleLogin) return { allowed: false, domain, company: domainRow.company, reason: 'Google sign-in is disabled for this workspace.' };
    if (domainRow.company?.status && domainRow.company.status !== 'ACTIVE') return { allowed: false, domain, company: domainRow.company, reason: 'This workspace is inactive. Contact your company admin.' };
    return { allowed: true, domain, company: domainRow.company, allowAutoJoin: Boolean(domainRow.allowAutoJoin) };
  }
}
