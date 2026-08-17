import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../database/supabase.service";
@Injectable()
export class AuditChecklistProgramAdapterService {
  constructor(readonly db: SupabaseService) {}
}
