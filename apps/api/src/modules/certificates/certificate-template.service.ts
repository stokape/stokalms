// ============================================================================
// certificate-template.service.ts — CRUD de plantillas de certificado
// (nivel tenant). Mismo patron que grading-scale.service.ts: resolver
// tenant -> withTenant -> Prisma.
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateCertificateTemplateDto } from './dto/create-certificate-template.dto';
import { UpdateCertificateTemplateDto } from './dto/update-certificate-template.dto';

@Injectable()
export class CertificateTemplateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(dto: CreateCertificateTemplateDto) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.certificateTemplate.create({
        data: {
          tenantId,
          name: dto.name,
          htmlTemplate: dto.htmlTemplate,
          dynamicFields: (dto.dynamicFields ?? []) as Prisma.InputJsonValue,
        },
      }),
    );
  }

  async findAll() {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.certificateTemplate.findMany({ orderBy: { name: 'asc' } }),
    );
  }

  async findOne(id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const template = await this.prisma.withTenant(tenantId, (tx) =>
      tx.certificateTemplate.findUnique({ where: { id } }),
    );
    if (!template) {
      throw new NotFoundException(`No existe la plantilla de certificado "${id}".`);
    }
    return template;
  }

  async update(id: string, dto: UpdateCertificateTemplateDto) {
    await this.findOne(id);
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.certificateTemplate.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.htmlTemplate !== undefined && { htmlTemplate: dto.htmlTemplate }),
          ...(dto.dynamicFields !== undefined && {
            dynamicFields: dto.dynamicFields as Prisma.InputJsonValue,
          }),
        },
      }),
    );
  }

  async remove(id: string) {
    await this.findOne(id);
    const tenantId = this.tenantContext.requireTenantId();
    // La FK requerida "templateId" en Certificate (ver schema.prisma) es
    // Restrict por defecto: Postgres rechaza este DELETE si ya se emitio
    // algun certificado con esta plantilla, y PrismaExceptionFilter traduce
    // ese error a un 409 Conflict claro (mismo mecanismo que
    // term/course/section, ver la nota extensa en Course.term).
    await this.prisma.withTenant(tenantId, (tx) => tx.certificateTemplate.delete({ where: { id } }));
    return { deleted: true };
  }
}
