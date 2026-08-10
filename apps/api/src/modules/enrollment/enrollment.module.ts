// ============================================================================
// enrollment.module.ts — Modulo de Matricula (ver docs/architecture/06-roadmap.md,
// Fase 1). No importa AcademicModule: valida la existencia de Section
// directamente contra Prisma (dentro del mismo tenant), sin necesitar sus
// servicios.
//
// SI importa CertificatesModule y AutomationsModule: al completar una
// matricula (ver enrollment.service.ts, updateStatus), se consulta si la
// automatizacion "auto_issue_certificate" esta prendida para este tenant
// (AutomationsService) y, si lo esta, se reusa CertificateService.issue()
// tal cual — ver la nota extensa en automations.service.ts.
// ============================================================================

import { Module } from '@nestjs/common';
import { CertificatesModule } from '../certificates/certificates.module';
import { AutomationsModule } from '../automations/automations.module';
import { EnrollmentController } from './enrollment.controller';
import { MyEnrollmentsController } from './my-enrollments.controller';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentAttachmentController } from './enrollment-attachment.controller';
import { EnrollmentAttachmentService } from './enrollment-attachment.service';

@Module({
  imports: [CertificatesModule, AutomationsModule],
  controllers: [EnrollmentController, MyEnrollmentsController, EnrollmentAttachmentController],
  providers: [EnrollmentService, EnrollmentAttachmentService],
})
export class EnrollmentModule {}
