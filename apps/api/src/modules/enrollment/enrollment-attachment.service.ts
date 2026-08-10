// ============================================================================
// enrollment-attachment.service.ts — Sustento (archivo de respaldo) de un
// cambio de estado de matrícula (ej. carta de retiro al marcar "dropped").
// Mismo patrón que resource.service.ts: sube el archivo entero a memoria
// antes de reenviarlo a MinIO/S3 (simplificación de MVP, ver la nota
// extensa en resource.controller.ts).
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { StorageService } from '../../common/storage/storage.service';
import { AuthenticatedUser } from '../../auth/auth.service';

@Injectable()
export class EnrollmentAttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly storage: StorageService,
  ) {}

  private async requireEnrollment(courseId: string, sectionId: string, id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const enrollment = await tx.enrollment.findUnique({ where: { id } });
      if (!enrollment || enrollment.sectionId !== sectionId) {
        throw new NotFoundException(`No existe la matrícula "${id}" en esta sección.`);
      }
      const section = await tx.section.findUnique({ where: { id: sectionId } });
      if (!section || section.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la sección "${sectionId}" en el curso "${courseId}".`,
        );
      }
      return enrollment;
    });
  }

  async findAll(courseId: string, sectionId: string, enrollmentId: string) {
    await this.requireEnrollment(courseId, sectionId, enrollmentId);
    const tenantId = this.tenantContext.requireTenantId();

    const attachments = await this.prisma.withTenant(tenantId, (tx) =>
      tx.enrollmentAttachment.findMany({
        where: { enrollmentId },
        include: { uploadedBy: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    );

    return Promise.all(
      attachments.map(async (a) => ({
        id: a.id,
        fileName: a.fileName,
        description: a.description,
        createdAt: a.createdAt,
        uploadedBy: { fullName: a.uploadedBy.user.fullName },
        downloadUrl: await this.storage.getPresignedDownloadUrl(a.storageKey),
      })),
    );
  }

  async upload(
    courseId: string,
    sectionId: string,
    enrollmentId: string,
    user: AuthenticatedUser,
    file: { originalname: string; mimetype: string; buffer: Buffer },
    description?: string,
  ) {
    await this.requireEnrollment(courseId, sectionId, enrollmentId);
    const tenantId = this.tenantContext.requireTenantId();

    const key = `enrollment-attachments/${tenantId}/${enrollmentId}/${randomUUID()}-${file.originalname}`;
    await this.storage.upload(key, file.buffer, file.mimetype);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.enrollmentAttachment.create({
        data: {
          tenantId,
          enrollmentId,
          uploadedById: user.userTenantId,
          storageKey: key,
          fileName: file.originalname,
          description,
        },
      }),
    );
  }
}
