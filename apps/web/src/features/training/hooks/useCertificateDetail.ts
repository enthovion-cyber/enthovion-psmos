import { useQuery } from '@tanstack/react-query';
import { certificationService } from '../services/certification.service';

export function useCertificateDetail(certificateId: string) {
  return useQuery({ queryKey: ['training', 'certificates', certificateId], queryFn: () => certificationService.detail(certificateId), enabled: Boolean(certificateId) });
}
