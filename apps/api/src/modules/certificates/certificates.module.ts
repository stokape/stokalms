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
})
export class CertificatesModule {}
