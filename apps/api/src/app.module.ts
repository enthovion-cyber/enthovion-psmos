import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { redisConfig } from './config/redis.config';
import { supabaseConfig } from './config/supabase.config';
import { SupabaseModule } from './database/supabase.module';
import { DocumentsModule } from './documents/documents.module';
import { EquipmentModule } from './equipment/equipment.module';
import { EventsModule } from './events/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { SearchModule } from './search/search.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { ActionsModule } from './actions/actions.module';
import { PtwModule } from './ptw/ptw.module';
import { MocModule } from './moc/moc.module';
import { PssrModule } from './pssr/pssr.module';
import { SignaturesModule } from './signatures/signatures.module';
import { HazopModule } from './hazop/hazop.module';
import { LopaModule } from './lopa/lopa.module';
import { IncidentModule } from './incidents/incident.module';
import { BillingModule } from './billing/billing.module';
import { MechanicalIntegrityModule } from './mechanical-integrity/mechanical-integrity.module';
import { PsiModule } from './psi/psi.module';
import { TrainingCompetencyModule } from './training-competency/training-competency.module';
import { AuditComplianceModule } from './audit-compliance/audit-compliance.module';
import { RegulatoryModule } from './regulatory/regulatory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env', '../../.env'],
      load: [appConfig, authConfig, redisConfig, supabaseConfig]
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('redis.url') ?? 'redis://localhost:6379' },
        skipVersionCheck: process.env.BULLMQ_SKIP_REDIS_VERSION_CHECK === 'true'
      })
    }),
    EventEmitterModule.forRoot({ wildcard: true }),
    ScheduleModule.forRoot(),
    SupabaseModule,
    EventsModule,
    AuditModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    TenantsModule,
    NotificationsModule,
    DocumentsModule,
    EquipmentModule,
    ActionsModule,
    WorkflowsModule,
    PtwModule,
    MocModule,
    PssrModule,
    HazopModule,
    LopaModule,
    IncidentModule,
    MechanicalIntegrityModule,
    PsiModule,
    TrainingCompetencyModule,
    AuditComplianceModule,
    RegulatoryModule,
    BillingModule,
    SignaturesModule,
    SearchModule
  ]
})
export class AppModule {}
