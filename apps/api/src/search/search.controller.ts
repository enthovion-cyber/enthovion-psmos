import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { SearchHistoryDto } from './dto/search-history.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  @Permissions(PermissionKeys.SearchUse)
  searchAll(@CurrentUser() user: RequestUser, @Query() query: SearchQueryDto) {
    return this.search.query(user, query);
  }

  @Get('recent')
  @Permissions(PermissionKeys.SearchUse)
  recent(@CurrentUser() user: RequestUser) {
    return this.search.recent(user);
  }

  @Post('history')
  @Permissions(PermissionKeys.SearchUse)
  history(@CurrentUser() user: RequestUser, @Body() dto: SearchHistoryDto) {
    return this.search.history(user, dto);
  }

  @Delete('recent')
  @Permissions(PermissionKeys.SearchUse)
  clearRecent(@CurrentUser() user: RequestUser) {
    return this.search.clearRecent(user);
  }

  @Post('reindex/:module')
  @Permissions(PermissionKeys.SearchReindex)
  reindex(@CurrentUser() user: RequestUser, @Param('module') module: string) {
    return this.search.reindex(user, module);
  }

  @Get('suggestions')
  @Permissions(PermissionKeys.SearchUse)
  suggestions(@CurrentUser() user: RequestUser, @Query('q') q = '') {
    return this.search.suggestions(user, q);
  }
}
