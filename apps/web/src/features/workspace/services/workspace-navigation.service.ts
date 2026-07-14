import { iamService } from '@/services/iam.service';
import type { NavigationResponse } from '@/features/navigation/types/navigation.types';

export const workspaceNavigationService = {
  navigation(): Promise<NavigationResponse> {
    return iamService.meNavigation() as Promise<NavigationResponse>;
  }
};
