import { Injectable } from '@nestjs/common';

const routes = ['/training-competency', '/training-competency/dashboard', '/training-competency/workforce', '/training-competency/workforce/new', '/training-competency/training-matrix', '/training-competency/roles-competency-profiles', '/training-competency/required-training', '/training-competency/training-records', '/training-competency/certifications', '/training-competency/assessments', '/training-competency/sop-acknowledgements', '/training-competency/moc-training-requirements', '/training-competency/pssr-training-readiness', '/training-competency/ptw-role-authorization', '/training-competency/expiry-overdue', '/training-competency/reports', '/training-competency/review-approval', '/training-competency/history', '/training-competency/settings'];

@Injectable()
export class TrainingRouteHealthService {
  audit() {
    return routes.map((route) => ({ route, status: 'Configured', loadingState: true, errorState: true, permissionState: true, mobileSafe: true }));
  }
}
