import { Injectable } from '@nestjs/common';
import { PermissionKeys } from '../../permissions/constants/permission-keys';

@Injectable()
export class EquipmentPolicy {
  canManage(permissions: string[]) {
    return permissions.includes(PermissionKeys.EquipmentManage);
  }
}
