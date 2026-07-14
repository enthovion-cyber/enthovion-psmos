'use client';

import { useMutation } from '@tanstack/react-query';
import { googleAuthService } from '../services/google-auth.service';

export function useGoogleLogin() {
  return useMutation({ mutationFn: googleAuthService.start });
}
