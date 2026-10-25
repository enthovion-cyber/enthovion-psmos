// apps/api/src/contractor-safety/contractor-portal.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Req
} from '@nestjs/common';
import { ContractorPortalService } from './contractor-portal.service';
import {
  AcknowledgeEvaluationDto,
  AddWorkerCertDto,
  CreateContractorDocumentDto,
  CreateContractorWorkerDto,
  PortalUpdateProfileDto,
  SubmitInductionQuizDto
} from './dto/contractor-safety.dto';

@Controller('contractor-portal')
export class ContractorPortalController {
  constructor(private readonly portal: ContractorPortalService) {}

  @Get(':token')
  getPortalOverview(
    @Param('token') token: string,
    @Headers('x-forwarded-for') forwardedIp?: string
  ) {
    return this.portal.getPortalOverview(token, forwardedIp);
  }

  @Post(':token/documents')
  uploadDocument(
    @Param('token') token: string,
    @Body() dto: CreateContractorDocumentDto,
    @Headers('x-forwarded-for') forwardedIp?: string
  ) {
    return this.portal.uploadDocument(token, dto, forwardedIp);
  }

  @Put(':token/profile')
  updateProfile(
    @Param('token') token: string,
    @Body() dto: PortalUpdateProfileDto,
    @Headers('x-forwarded-for') forwardedIp?: string
  ) {
    return this.portal.updateProfile(token, dto, forwardedIp);
  }

  @Get(':token/workers')
  getPortalWorkers(
    @Param('token') token: string,
    @Headers('x-forwarded-for') forwardedIp?: string
  ) {
    return this.portal.getPortalWorkers(token, forwardedIp);
  }

  @Post(':token/workers')
  createPortalWorker(
    @Param('token') token: string,
    @Body() dto: CreateContractorWorkerDto,
    @Headers('x-forwarded-for') forwardedIp?: string
  ) {
    return this.portal.createPortalWorker(token, dto, forwardedIp);
  }

  @Post(':token/workers/:workerId/certifications')
  addPortalWorkerCert(
    @Param('token') token: string,
    @Param('workerId') workerId: string,
    @Body() dto: AddWorkerCertDto,
    @Headers('x-forwarded-for') forwardedIp?: string
  ) {
    return this.portal.addPortalWorkerCert(token, workerId, dto, forwardedIp);
  }

  @Get(':token/inductions')
  getPortalInductionCourses(
    @Param('token') token: string,
    @Headers('x-forwarded-for') forwardedIp?: string
  ) {
    return this.portal.getPortalInductionCourses(token, forwardedIp);
  }

  @Post(':token/workers/:workerId/inductions/:courseId/submit')
  submitPortalWorkerInduction(
    @Param('token') token: string,
    @Param('workerId') workerId: string,
    @Param('courseId') courseId: string,
    @Body() dto: SubmitInductionQuizDto,
    @Headers('x-forwarded-for') forwardedIp?: string
  ) {
    return this.portal.submitPortalWorkerInduction(token, workerId, courseId, dto, forwardedIp);
  }

  @Get(':token/workers/:workerId/gate-pass')
  getPortalWorkerGatePass(
    @Param('token') token: string,
    @Param('workerId') workerId: string,
    @Headers('x-forwarded-for') forwardedIp?: string
  ) {
    return this.portal.getPortalWorkerGatePass(token, workerId, forwardedIp);
  }

  @Get(':token/evaluations')
  getPortalEvaluations(
    @Param('token') token: string,
    @Headers('x-forwarded-for') forwardedIp?: string
  ) {
    return this.portal.getPortalEvaluations(token, forwardedIp);
  }

  @Post(':token/evaluations/:evalId/acknowledge')
  acknowledgePortalEvaluation(
    @Param('token') token: string,
    @Param('evalId') evalId: string,
    @Body() dto: AcknowledgeEvaluationDto,
    @Headers('x-forwarded-for') forwardedIp?: string
  ) {
    return this.portal.acknowledgePortalEvaluation(token, evalId, dto, forwardedIp);
  }
}
