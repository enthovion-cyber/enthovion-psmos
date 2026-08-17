import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calibrationEvaluationService } from '../services/calibration-evaluation.service';

export function useCalibrationEvaluation(recordId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => calibrationEvaluationService.evaluate(recordId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'calibration-record', recordId] })
  });
}

