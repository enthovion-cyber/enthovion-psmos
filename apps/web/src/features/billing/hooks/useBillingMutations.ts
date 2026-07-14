'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '../services/billing.service';
import { paymentMethodService } from '../services/payment-method.service';
import { usageService } from '../services/usage.service';

export function useBillingMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['billing'] });
  return {
    checkout: useMutation({ mutationFn: billingService.checkout }),
    customerPortal: useMutation({ mutationFn: billingService.customerPortal }),
    changePlan: useMutation({ mutationFn: billingService.changePlan, onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: billingService.cancel, onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: billingService.reactivate, onSuccess: invalidate }),
    setDefaultPaymentMethod: useMutation({ mutationFn: paymentMethodService.setDefault, onSuccess: invalidate }),
    recalculateUsage: useMutation({ mutationFn: usageService.recalculate, onSuccess: invalidate })
  };
}
