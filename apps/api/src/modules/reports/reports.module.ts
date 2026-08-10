// ============================================================================
// reports.module.ts — Ver reports.controller.ts. Importa GradebookModule
// para reusar "computeCourseGrades" en el reporte de notas (ver la nota
// extensa en reports.service.ts). Exporta ReportsService para que
// AutomationsModule pueda reusar "getAtRiskStudentsForTenant" en el
// resumen semanal de alumnos en riesgo (ver automations.service.ts).
// ============================================================================

import { Module } from '@nestjs/common';
import { GradebookModule } from '../gradebook/gradebook.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [GradebookModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
