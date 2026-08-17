'use client';

import { useMemo, useState } from 'react';
import { useCmlImport } from '../hooks/useCmlImport';
import { CmlImportCommitPanel } from './CmlImportCommitPanel';
import { CmlImportErrorReport } from './CmlImportErrorReport';
import { CmlImportPreviewTable } from './CmlImportPreviewTable';
import { CmlImportUploader } from './CmlImportUploader';

const cmlColumns = ['cml_number','cml_type','description','equipment_section','piping_circuit','component_type','location_description','orientation','drawing_reference','isometric_reference','material','damage_mechanism','nominal_thickness','original_thickness','minimum_required_thickness','alert_thickness','retirement_thickness','thickness_unit','inspection_method'];
const readingColumns = ['cml_number','reading_date','thickness_value','thickness_unit','measurement_point_label','scan_direction','surface_condition','inspector_name','instrument_used','notes'];

export function CmlImportPage({ equipmentId, readingImport = false }: { equipmentId: string; readingImport?: boolean }) {
  const [text, setText] = useState('');
  const [job, setJob] = useState<Record<string, any> | null>(null);
  const mutations = useCmlImport(equipmentId, readingImport ? 'reading' : 'cml');
  const columns = readingImport ? readingColumns : cmlColumns;
  const rows = useMemo(() => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => Object.fromEntries(line.split(',').map((value, index) => [columns[index] ?? `column_${index + 1}`, value.trim()]))), [text, columns]);
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-[var(--psm-text)]">{readingImport ? 'Import UT Readings' : 'Import CML/TML Records'}</h2>
        <p className="text-sm text-[var(--psm-muted)]">Upload/paste CSV data, preview rows, create a backend import job, validate, then commit. No rows are committed until validation passes.</p>
      </div>
      <CmlImportUploader value={text} onChange={setText} readingImport={readingImport} />
      <CmlImportPreviewTable rows={rows} />
      <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={mutations.create.isPending || !rows.length} onClick={() => mutations.create.mutate(rows, { onSuccess: (data) => setJob(data as Record<string, any>) })}>{mutations.create.isPending ? 'Creating Job...' : 'Create Import Job'}</button>
      <CmlImportErrorReport job={job} />
      <CmlImportCommitPanel job={job} validating={mutations.validate.isPending} committing={mutations.commit.isPending} onValidate={() => job?.id && mutations.validate.mutate(String(job.id), { onSuccess: (data) => setJob(data as Record<string, any>) })} onCommit={() => job?.id && mutations.commit.mutate(String(job.id), { onSuccess: (data) => setJob(data as Record<string, any>) })} />
    </div>
  );
}
