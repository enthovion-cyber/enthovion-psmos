import { Module } from '@nestjs/common';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { SearchController } from './search.controller';
import { SearchIndexService } from './search-index.service';
import { SearchRepository } from './repositories/search.repository';
import { SearchService } from './search.service';

@Module({
  imports: [SupabaseModule, PermissionsModule, TenantsModule],
  controllers: [SearchController],
  providers: [SearchService, SearchIndexService, SearchRepository],
  exports: [SearchService, SearchIndexService]
})
export class SearchModule {}
