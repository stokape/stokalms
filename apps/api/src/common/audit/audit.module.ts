// ============================================================================
// audit.module.ts — Expone AuditService a toda la aplicacion. @Global() por
// el mismo motivo que MailModule/StorageModule: varios modulos de negocio
// sin relacion entre si (usuarios, tenant, certificados, matriculas,
// cohortes) necesitan registrar auditoria, sin repetir el import en cada uno.
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
