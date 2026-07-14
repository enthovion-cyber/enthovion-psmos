'use client';

import { useMutation } from '@tanstack/react-query';
import { passwordService } from '../services/password.service';

export function useResetPassword() {
  return useMutation({ mutationFn: (input: { token: string; password: string }) => passwordService.reset(input.token, input.password) });
}
