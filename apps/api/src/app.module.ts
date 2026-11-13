import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { IdentityModule } from './identity/identity.module';
import { RolesGuard } from './identity/roles.guard';
import { TenantContextGuard } from './identity/tenant-context.guard';
import { StorageModule } from './storage/storage.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    IdentityModule,
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
  ],
})
export class AppModule {}
