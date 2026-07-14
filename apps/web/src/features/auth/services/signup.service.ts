import { api } from '@/services/api';
import type { CompleteSignupInput, SignupAuthResult, SignupEmailInput, SignupSessionStatus } from '../types/signup.types';
import type { SignupPlansResult } from '../types/signup-plan.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const signupService = {
  async email(input: SignupEmailInput) {
    return unwrap<SignupAuthResult>(await api.post('/auth/signup/email', input));
  },
  async resendVerification(email: string) {
    return unwrap<{ success: boolean; message: string; sessionId?: string }>(await api.post('/auth/signup/resend-verification', { email }));
  },
  async status(input: { sessionId?: string; email?: string }) {
    return unwrap<SignupSessionStatus>(await api.get('/auth/signup/status', { params: input }));
  },
  async nextStep(input: { sessionId?: string; email?: string }) {
    return unwrap<SignupSessionStatus>(await api.get('/auth/signup/next-step', { params: input }));
  },
  async completeWorkspace(input: CompleteSignupInput) {
    return unwrap<SignupAuthResult>(await api.post('/auth/signup/complete-workspace', input));
  },
  async plans() {
    return unwrap<SignupPlansResult>(await api.get('/auth/signup/plans'));
  },
  async startTrial(input: { sessionId?: string; companyId?: string }) {
    return unwrap<{ success: boolean; status: string; next?: string; trialEnd?: string }>(await api.post('/auth/signup/start-trial', input));
  },
  async startCheckout(input: { sessionId?: string; companyId?: string; planCode: string }) {
    return unwrap<{ success: boolean; status: string; message?: string; plan?: unknown }>(await api.post('/auth/signup/start-checkout', input));
  },
  async postCallback(input: { flow?: string; provider?: string; email: string; providerUserId?: string; displayName?: string; avatarUrl?: string; emailVerified?: boolean; intent?: string | null; planCode?: string | null }) {
    return unwrap<SignupAuthResult>(await api.post('/auth/post-callback', input));
  }
};
