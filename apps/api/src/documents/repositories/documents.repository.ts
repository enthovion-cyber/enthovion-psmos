import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class DocumentsRepository {
  constructor(public readonly db: SupabaseService) {}
  documents() { return this.db.from('documents'); }
  versions() { return this.db.from('document_versions'); }
  relations() { return this.db.from('document_relations'); }
  reviews() { return this.db.from('document_reviews'); }
  approvals() { return this.db.from('document_approvals'); }
  comments() { return this.db.from('document_comments'); }
  accessLogs() { return this.db.from('document_access_logs'); }
  tags() { return this.db.from('document_tags'); }
  folders() { return this.db.from('document_folders'); }
  equipmentTimeline() { return this.db.from('EquipmentTimelineEvent'); }
  equipmentDocuments() { return this.db.from('EquipmentDocument'); }
}
