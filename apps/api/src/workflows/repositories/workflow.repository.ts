import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class WorkflowRepository {
  constructor(public readonly db: SupabaseService) {}

  templates() {
    return this.db.from('workflow_templates');
  }

  templateSteps() {
    return this.db.from('workflow_template_steps');
  }

  instances() {
    return this.db.from('workflow_instances');
  }

  instanceSteps() {
    return this.db.from('workflow_instance_steps');
  }

  approvals() {
    return this.db.from('workflow_approvals');
  }

  comments() {
    return this.db.from('workflow_comments');
  }

  history() {
    return this.db.from('workflow_history');
  }

  escalations() {
    return this.db.from('workflow_escalations');
  }

  users() {
    return this.db.from('User');
  }

  userRoles() {
    return this.db.from('UserRole');
  }
}
