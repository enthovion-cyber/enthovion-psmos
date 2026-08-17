import { workforceService } from './workforce.service';

export const workerAccountLinkService = {
  link: workforceService.linkAccount,
  invite: workforceService.inviteAccount
};
