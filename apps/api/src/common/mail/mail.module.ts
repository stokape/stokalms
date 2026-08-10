// ============================================================================
// mail.module.ts — Expone MailService a toda la aplicacion. @Global() por
// el mismo motivo que StorageModule: cualquier modulo de negocio que
// necesite enviar un correo (hoy, solo automations.module.ts) lo va a
// necesitar, sin repetir el import en cada uno.
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
