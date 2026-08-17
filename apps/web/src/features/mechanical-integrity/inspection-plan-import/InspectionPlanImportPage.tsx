'use client';

import { useState } from 'react';
import { useInspectionPlanImport } from '../hooks/useInspectionPlanImport';
import { InspectionPlanImportCommitPanel } from './InspectionPlanImportCommitPanel';
import { InspectionPlanImportErrorReport } from './InspectionPlanImportErrorReport';
import { InspectionPlanImportPreviewTable } from './InspectionPlanImportPreviewTable';
import { InspectionPlanImportUploader } from './InspectionPlanImportUploader';

export function InspectionPlanImportPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [job, setJob] = useState<any>(null);
  const imp = useInspectionPlanImport();
  return <div className="space-y-5"><div><h1 className="text-2xl font-bold text-[var(--psm-text)]">Import Inspection Plans</h1><p className="text-sm text-[var(--psm-muted)]">Upload CSV/XLSX data, preview rows, validate, then commit as draft plans.</p></div><InspectionPlanImportUploader onRows={(next) => { setRows(next); imp.create.mutate(next, { onSuccess: setJob }); }} /><InspectionPlanImportPreviewTable rows={rows} /><InspectionPlanImportCommitPanel job={job} validating={imp.validate.isPending} committing={imp.commit.isPending} onValidate={() => job && imp.validate.mutate(job.id, { onSuccess: setJob })} onCommit={() => job && imp.commit.mutate(job.id, { onSuccess: setJob })} /><InspectionPlanImportErrorReport job={job} /></div>;
}
