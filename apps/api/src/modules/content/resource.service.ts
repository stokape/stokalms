// ============================================================================
// resource.service.ts — Lógica de negocio de los Recursos (el contenido
// "descargable/reproducible" de una lección: video, PDF, paquete SCORM, o
// un enlace externo). Es el único punto del módulo Content que habla con
// StorageService (ver common/storage/storage.service.ts) — el mismo
// cliente que ya usa el módulo de Certificados para los PDF emitidos.
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { StorageService } from '../../common/storage/storage.service';
import { LessonService } from './lesson.service';
import { CreateLinkResourceDto } from './dto/create-link-resource.dto';

// Deduce el "type" del Resource (ver schema.prisma: "video" | "pdf" |
// "scorm" | "link" | "doc") a partir del mimetype real del archivo subido,
// para que el frontend sepa qué reproductor/ícono mostrar sin tener que
// adivinarlo de la extensión del nombre de archivo.
function inferResourceType(mimeType: string): string {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  // Los paquetes SCORM viajan como un .zip (imscp.xml adentro) — no hay un
  // mimetype propio de SCORM, así que zip es la mejor señal disponible sin
  // abrir el archivo a inspeccionar su contenido.
  if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') return 'scorm';
  return 'doc';
}

@Injectable()
export class ResourceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly storage: StorageService,
    private readonly lessonService: LessonService,
  ) {}

  async uploadFile(
    courseId: string,
    moduleId: string,
    lessonId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    title?: string,
  ) {
    // Verifica que la lección exista y pertenezca a este módulo/curso ANTES
    // de gastar tiempo/ancho de banda subiendo el archivo a MinIO/S3.
    await this.lessonService.findOne(courseId, moduleId, lessonId);
    const tenantId = this.tenantContext.requireTenantId();

    const type = inferResourceType(file.mimetype);
    // La KEY dentro del bucket incluye el tenantId a propósito (aislamiento
    // también a nivel de almacenamiento, no solo de base de datos) y un
    // UUID para que dos archivos con el mismo nombre no se pisen entre sí.
    const key = `resources/${tenantId}/${lessonId}/${randomUUID()}-${file.originalname}`;
    await this.storage.upload(key, file.buffer, file.mimetype);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.resource.create({
        data: {
          tenantId,
          lessonId,
          type,
          storageUrl: key,
          metadata: {
            title: title ?? file.originalname,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          } as Prisma.InputJsonValue,
        },
      }),
    );
  }

  async createLink(
    courseId: string,
    moduleId: string,
    lessonId: string,
    dto: CreateLinkResourceDto,
  ) {
    await this.lessonService.findOne(courseId, moduleId, lessonId);
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.resource.create({
        data: {
          tenantId,
          lessonId,
          type: 'link',
          storageUrl: dto.url,
          metadata: {
            title: dto.title,
            description: dto.description,
          } as Prisma.InputJsonValue,
        },
      }),
    );
  }

  async findAllByLesson(courseId: string, moduleId: string, lessonId: string) {
    await this.lessonService.findOne(courseId, moduleId, lessonId);
    const tenantId = this.tenantContext.requireTenantId();
    const resources = await this.prisma.withTenant(tenantId, (tx) =>
      tx.resource.findMany({ where: { lessonId } }),
    );
    // Se incluye "downloadUrl" ya resuelto en el LISTADO (no solo al pedir
    // un recurso por separado) para que la pantalla no tenga que hacer un
    // pedido extra por cada fila — mismo criterio que
    // certificate.service.ts (findAllByEnrollment) con el PDF de cada
    // certificado.
    return Promise.all(resources.map((resource) => this.withDownloadUrl(resource)));
  }

  private async withDownloadUrl(resource: { type: string; storageUrl: string }) {
    if (resource.type === 'link') {
      return { ...resource, downloadUrl: resource.storageUrl };
    }
    const downloadUrl = await this.storage.getPresignedDownloadUrl(resource.storageUrl);
    return { ...resource, downloadUrl };
  }

  private async findOne(courseId: string, moduleId: string, lessonId: string, id: string) {
    await this.lessonService.findOne(courseId, moduleId, lessonId);
    const tenantId = this.tenantContext.requireTenantId();
    const resource = await this.prisma.withTenant(tenantId, (tx) =>
      tx.resource.findUnique({ where: { id } }),
    );
    if (!resource || resource.lessonId !== lessonId) {
      throw new NotFoundException(`No existe el recurso "${id}" en esa lección.`);
    }
    return resource;
  }

  // Un recurso "link" ya ES una URL utilizable directamente (apunta afuera
  // de nuestro almacenamiento); un recurso subido como archivo vive en un
  // bucket PRIVADO, así que hace falta pedir una URL firmada de corta
  // duración (mismo patrón que certificate.service.ts con el PDF emitido).
  async getDownloadUrl(courseId: string, moduleId: string, lessonId: string, id: string) {
    const resource = await this.findOne(courseId, moduleId, lessonId, id);
    return this.withDownloadUrl(resource);
  }

  async remove(courseId: string, moduleId: string, lessonId: string, id: string) {
    await this.findOne(courseId, moduleId, lessonId, id);
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, (tx) => tx.resource.delete({ where: { id } }));
    return { deleted: true };
  }
}
