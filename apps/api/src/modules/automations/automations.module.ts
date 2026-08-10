// ============================================================================
// automations.module.ts — Ver automations.controller.ts. MailModule y
// PrismaModule son @Global() (no hace falta importarlos). ReportsModule SI
// se importa: "sendInactivityAlerts"/"sendAtRiskDigest" reusan
// "getAtRiskStudentsForTenant" de ReportsService en vez de reimplementar la
// misma heuristica (ver reports.service.ts). Exporta AutomationsService
// para que EnrollmentModule pueda consultar "isFeatureEnabled" al completar
// una matricula (ver enrollment.service.ts).
// ============================================================================

import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports/reports.module';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';

@Module({
  imports: [ReportsModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
