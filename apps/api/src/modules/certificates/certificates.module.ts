// ============================================================================
// certificates.module.ts — Agrupa plantillas de certificado, emision,
// consulta, revocacion y verificacion publica (ver
// docs/architecture/06-roadmap.md, Fase 1, y 04-flujos-criticos.md, 4.3).
//
// No importa StorageModule explicitamente: StorageService es @Global() (ver
// common/storage/storage.module.ts), igual que PrismaModule/TenantModule.
// ============================================================================

import { Module } from '@nestjs/common';
import { CertificateTemplateController } from './certificate-template.controller';
import { CertificateTemplateService } from './certificate-template.service';
import { CertificateController, CertificateByIdController } from './certificate.controller';
import { CertificateService } from './certificate.service';
import { CertificateRendererService } from './certificate-renderer.service';
import { VerifyController } from './verify.controller';

@Module({
  controllers: [
    CertificateTemplateController,
    CertificateController,
    CertificateByIdController,
    VerifyController,
  ],
  providers: [CertificateTemplateService, CertificateService, CertificateRendererService],
  // Exportado para que EnrollmentModule pueda reusar EXACTAMENTE la misma
  // logica de emision (validaciones incluidas) al automatizar la emision
  // en "completed" — ver la nota extensa en automations.service.ts.
  exports: [CertificateService],
})
export class CertificatesModule {}
