import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class PssrNumberingService {
  constructor(private readonly db: SupabaseService) {}

  async next(tenantId: string) {
    const year = new Date().getFullYear();
    const rows = await this.db.many<any>(
      this.db.from('pssrs').select('pssr_number').eq('tenant_id', tenantId).ilike('pssr_number', `PSSR-${year}-%`).order('pssr_number', { ascending: false }).limit(1)
    );
    const last = rows[0]?.pssr_number ? Number(String(rows[0].pssr_number).split('-').pop()) : 0;
    return `PSSR-${year}-${String(last + 1).padStart(6, '0')}`;
  }
}
