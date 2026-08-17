'use client';

import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import type { AuditProgram } from '../types/audit.types';
import { AuditProgramForm } from './AuditProgramForm';

export function AuditProgramFormPage({ initialProgram }: { initialProgram?: Partial<AuditProgram> | undefined }) {
  return <AuditLayout><div className="space-y-6"><AuditHeader title={initialProgram?.id ? 'Edit Audit Program' : 'Create Audit Program'} /><AuditProgramForm initialProgram={initialProgram} /></div></AuditLayout>;
}
