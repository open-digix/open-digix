import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuditDenialFilter } from './audit-denial.filter';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [
    AuditRepository,
    AuditService,
    { provide: APP_FILTER, useClass: AuditDenialFilter },
  ],
  exports: [AuditService],
})
export class AuditModule {}
