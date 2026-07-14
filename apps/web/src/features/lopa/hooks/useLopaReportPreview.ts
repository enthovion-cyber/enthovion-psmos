import { useMutation } from '@tanstack/react-query';
import { lopaFinalReportService } from '../services/lopa-final-report.service';
import type { LopaReportGenerateInput } from '../types/lopa-final-report.types';
export function useLopaReportPreview(id: string) { return useMutation({ mutationFn: (values: LopaReportGenerateInput) => lopaFinalReportService.preview(id, values) }); }
