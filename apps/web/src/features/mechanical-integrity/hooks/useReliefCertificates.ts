import { useQuery } from '@tanstack/react-query';
import { reliefCertificateService } from '../services/relief-certificate.service';

export function useReliefCertificates(reliefDeviceId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'relief-certificates', reliefDeviceId], queryFn: () => reliefCertificateService.list(reliefDeviceId!), enabled: !!reliefDeviceId });
}
