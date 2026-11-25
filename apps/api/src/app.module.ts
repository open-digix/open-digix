import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { BuilderModule } from './builder/builder.module';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { IdentityModule } from './identity/identity.module';
import { AppPermissionGuard } from './identity/app-permission.guard';
import { RolesGuard } from './identity/roles.guard';
import { TenantContextGuard } from './identity/tenant-context.guard';
import { OnboardingModule } from './onboarding/onboarding.module';
import { StorageModule } from './storage/storage.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    IdentityModule,
    OnboardingModule,
    BuilderModule,
    StorageModule,
    WorkflowModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    HealthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantContextGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: AppPermissionGuard },
  ],
})
export class AppModule {}
