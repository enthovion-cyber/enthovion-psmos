import { api } from '@/services/api';
import type { ReliefCertificate } from '../types/relief-certificate.types';

function unwrap<T>(response: any): T {
  return response.data.data as T;
}

export const reliefCertificateService = {
  list(reliefDeviceId: string): Promise<ReliefCertificate[]> {
    return api.get(`/mechanical-integrity/relief-devices/${reliefDeviceId}/certificates`).then((response) => unwrap<ReliefCertificate[]>(response));
  },
  add(reliefDeviceId: string, input: Record<string, unknown>): Promise<ReliefCertificate> {
    return api.post(`/mechanical-integrity/relief-devices/${reliefDeviceId}/certificates`, input).then((response) => unwrap<ReliefCertificate>(response));
  }
};
