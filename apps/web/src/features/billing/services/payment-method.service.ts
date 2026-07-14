import { api } from '@/services/api';
import { unwrap } from './billing.service';
import type { PaymentMethod } from '../types/payment-method.types';

export const paymentMethodService = {
  list: () => api.get('/billing/payment-methods').then(unwrap<PaymentMethod[]>),
  setDefault: (paymentMethodId: string) => api.post('/billing/payment-methods/default', { paymentMethodId }).then(unwrap<PaymentMethod>)
};
