import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class PermitRepository {
  constructor(public readonly db: SupabaseService) {}

  permits() { return this.db.from('permits'); }
  permitTypes() { return this.db.from('permit_types'); }
  equipment() { return this.db.from('permit_equipment'); }
  isolations() { return this.db.from('permit_isolations'); }
  isolationCertificates() { return this.db.from('permit_isolation_certificates'); }
  isolationHistory() { return this.db.from('permit_isolation_history'); }
  gasTests() { return this.db.from('permit_gas_tests'); }
  gasReadings() { return this.db.from('permit_gas_readings'); }
  gasTestHistory() { return this.db.from('permit_gas_test_history'); }
  conflicts() { return this.db.from('permit_conflicts'); }
  conflictOverrides() { return this.db.from('permit_conflict_overrides'); }
  simopsReviews() { return this.db.from('permit_simops_reviews'); }
  simopsControls() { return this.db.from('permit_simops_controls'); }
  conflictMatrixRules() { return this.db.from('permit_conflict_matrix_rules'); }
  conflictHistory() { return this.db.from('permit_conflict_history'); }
  workforce() { return this.db.from('permit_workforce'); }
  briefings() { return this.db.from('permit_briefings'); }
  workforceHistory() { return this.db.from('permit_workforce_history'); }
  handover() { return this.db.from('permit_handover'); }
  shiftHandovers() { return this.db.from('permit_shift_handovers'); }
  handoverChecklistItems() { return this.db.from('permit_handover_checklist_items'); }
  handoverHistory() { return this.db.from('permit_handover_history'); }
  attachments() { return this.db.from('permit_attachments'); }
  attachmentRequirements() { return this.db.from('permit_attachment_requirements'); }
  history() { return this.db.from('permit_history'); }
  signatures() { return this.db.from('permit_signatures'); }
  signatureRequirements() { return this.db.from('permit_signature_requirements'); }
  signatureHistory() { return this.db.from('permit_signature_history'); }
  extensions() { return this.db.from('permit_extensions'); }
  templates() { return this.db.from('permit_templates'); }
  closureChecklists() { return this.db.from('permit_closure_checklists'); }
  mapLocations() { return this.db.from('permit_map_locations'); }
  mapLayouts() { return this.db.from('ptw_map_layouts'); }
  mapZones() { return this.db.from('ptw_map_zones'); }
  mapMarkers() { return this.db.from('ptw_map_markers'); }
  thresholds() { return this.db.from('permit_gas_thresholds'); }
  incompatibleMatrix() { return this.db.from('permit_incompatible_matrix'); }
}
