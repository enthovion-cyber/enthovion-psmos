import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { TrainingPssrReadinessService } from './training-pssr-readiness.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('pssr')
export class PssrTrainingController {
  constructor(private readonly pssrTraining: TrainingPssrReadinessService) {}

  @Get(':pssrId/training-requirements')
  @Permissions('training.pssr.readiness.view')
  readinessRecords(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.pssrReadinessRecords(user, pssrId, query);
  }

  @Post(':pssrId/training-readiness')
  @Permissions('training.pssr.readiness.create')
  createReadiness(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.createForPssr(user, pssrId, dto);
  }

  @Get(':pssrId/training-readiness')
  @Permissions('training.pssr.readiness.view')
  readiness(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string) {
    return this.pssrTraining.pssrReadiness(user, pssrId);
  }

  @Post(':pssrId/training-readiness/run')
  @Permissions('training.pssr.readiness.run')
  runReadiness(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.runPssrReadiness(user, pssrId, dto);
  }

  @Get(':pssrId/training-blockers')
  @Permissions('training.pssr.blocker.view')
  blockers(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.pssrBlockers(user, pssrId, query);
  }

  @Get(':pssrId/training-evidence')
  @Permissions('training.pssr.evidence.view')
  evidence(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.pssrEvidence(user, pssrId, query);
  }

  @Get(':pssrId/training-impact-check')
  @Permissions('training.pssr.impact_check.view')
  impactCheck(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.pssrImpactCheck(user, pssrId, query);
  }

  @Post(':pssrId/training-impact-check/run')
  @Permissions('training.pssr.impact_check.run')
  runImpactCheck(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.runPssrImpactCheck(user, pssrId, dto);
  }

  @Get(':pssrId/training-readiness-check')
  @Permissions('training.pssr.readiness_check.view')
  readinessCheck(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Query() query: Record<string, any>) {
    return this.pssrTraining.pssrImpactCheck(user, pssrId, query);
  }

  @Post(':pssrId/training-readiness-check/run')
  @Permissions('training.pssr.readiness_check.run')
  runReadinessCheck(@CurrentUser() user: RequestUser, @Param('pssrId') pssrId: string, @Body() dto: Record<string, any>) {
    return this.pssrTraining.runPssrImpactCheck(user, pssrId, dto);
  }
}

