import { workforceService } from './workforce.service';

export const workerAssignmentService = {
  add: workforceService.addAssignment,
  update: workforceService.updateAssignment,
  remove: workforceService.removeAssignment,
  addRole: workforceService.addRoleAssignment
};
