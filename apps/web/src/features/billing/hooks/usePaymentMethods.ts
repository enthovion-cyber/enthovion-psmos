'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentMethodService } from '../services/payment-method.service';

export function usePaymentMethods() {
  return useQuery({ queryKey: ['billing', 'payment-methods'], queryFn: paymentMethodService.list });
}
