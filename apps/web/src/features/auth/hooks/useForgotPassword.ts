'use client';

import { useMutation } from '@tanstack/react-query';
import { passwordService } from '../services/password.service';

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => passwordService.forgot(email) });
}
