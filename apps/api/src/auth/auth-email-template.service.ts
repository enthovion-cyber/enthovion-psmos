import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthEmailTemplateService {
  passwordReset(resetLink: string, expiryMinutes = 60) {
    return {
      subject: 'Reset your PSM OS password',
      text: `Use this secure link to reset your PSM OS password: ${resetLink}\nThis link expires in ${expiryMinutes} minutes.\nIf you did not request this, contact your company admin.`
    };
  }

  inviteAcceptance(inviteLink: string, companyName?: string | null, roleSummary?: string | null, expiry?: string | null) {
    return {
      subject: 'You are invited to PSM OS',
      text: `You have been invited${companyName ? ` to ${companyName}` : ''}.\nRole/access: ${roleSummary ?? 'Assigned by your admin'}.\nAccept securely: ${inviteLink}\nExpiry: ${expiry ?? 'See invitation'}`
    };
  }

  securityAlert(title: string, details: string) {
    return { subject: title, text: details };
  }
}
