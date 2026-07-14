'use client';

import { useMutation } from '@tanstack/react-query';
import { passwordService } from '../services/password.service';

export function useForceChangePassword() {
  return useMutation({ mutationFn: passwordService.forceChange });
}
