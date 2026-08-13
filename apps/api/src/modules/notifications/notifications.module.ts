// ============================================================================
// notifications.module.ts — Expone NotificationService a toda la aplicacion.
// @Global() por el mismo motivo que AuditModule/StorageModule: modulos de
// negocio sin relacion entre si (usuarios, certificados, y los que se sumen
// despues) necesitan poder avisarle algo a una persona puntual, sin repetir
// el import en cada uno.
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Global()
@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
