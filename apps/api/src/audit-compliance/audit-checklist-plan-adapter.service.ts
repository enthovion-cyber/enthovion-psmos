import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../database/supabase.service";
@Injectable()
export class AuditChecklistPlanAdapterService {
  constructor(readonly db: SupabaseService) {}
}
