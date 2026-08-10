// ============================================================================
// ai.module.ts — Expone AiService a toda la aplicacion. @Global() por el
// mismo motivo que MailModule: hoy solo lo usa content/lesson.service.ts,
// pero cualquier otro modulo que sume una funcionalidad de IA mas adelante
// (ver los puntos 13 descartados por ahora, "Reportes personalizados"
// generado con IA, etc.) lo va a necesitar igual, sin repetir el import.
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';

@Global()
@Module({
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
