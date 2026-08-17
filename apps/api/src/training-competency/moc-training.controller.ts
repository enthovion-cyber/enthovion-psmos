import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { TrainingMocRequirementService } from './training-moc-requirement.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('moc')
export class MocTrainingController {
  constructor(private readonly mocTraining: TrainingMocRequirementService) {}

  @Get(':mocId/training-requirements')
  @Permissions('training.moc.requirement.view')
  requirements(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.mocRequirements(user, mocId, query);
  }

  @Post(':mocId/training-requirements')
  @Permissions('training.moc.requirement.create')
  createRequirement(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.createForMoc(user, mocId, dto);
  }

  @Get(':mocId/training-readiness')
  @Permissions('training.moc.readiness.view')
  readiness(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string) {
    return this.mocTraining.mocReadiness(user, mocId);
  }

  @Post(':mocId/training-readiness/run')
  @Permissions('training.moc.readiness.run')
  runReadiness(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.runMocReadiness(user, mocId, dto);
  }

  @Get(':mocId/training-blockers')
  @Permissions('training.moc.blocker.view')
  blockers(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.mocBlockers(user, mocId, query);
  }

  @Get(':mocId/training-evidence')
  @Permissions('training.moc.evidence.view')
  evidence(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.mocEvidence(user, mocId, query);
  }

  @Get(':mocId/training-impact-check')
  @Permissions('training.moc.impact_check.view')
  impactCheck(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Query() query: Record<string, any>) {
    return this.mocTraining.mocImpactCheck(user, mocId, query);
  }

  @Post(':mocId/training-impact-check/run')
  @Permissions('training.moc.impact_check.run')
  runImpactCheck(@CurrentUser() user: RequestUser, @Param('mocId') mocId: string, @Body() dto: Record<string, any>) {
    return this.mocTraining.runMocImpactCheck(user, mocId, dto);
  }
}
