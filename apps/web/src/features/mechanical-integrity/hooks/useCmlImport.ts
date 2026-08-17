'use client';

import { useMutation } from '@tanstack/react-query';
import { miCmlService } from '../services/cml.service';

export function useCmlImport(equipmentId: string, importType: 'cml' | 'reading' = 'cml') {
  const create = useMutation({ mutationFn: (rows: Array<Record<string, unknown>>) => importType === 'reading' ? miCmlService.importReadingRows(equipmentId, rows) : miCmlService.importRows(equipmentId, rows) });
  const validate = useMutation({ mutationFn: (jobId: string) => miCmlService.validateImportJob(equipmentId, jobId) });
  const commit = useMutation({ mutationFn: (jobId: string) => miCmlService.commitImportJob(equipmentId, jobId) });
  return { create, validate, commit };
}
