'use client';

import { useMutation } from '@tanstack/react-query';
import { passwordService } from '../services/password.service';

export function useChangePassword() {
  return useMutation({ mutationFn: passwordService.change });
}
