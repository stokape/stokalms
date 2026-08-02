// ============================================================================
// tenant.service.ts — Ver y editar los datos del tenant ACTIVO del request
// (nombre, marca) — nunca de otro tenant: no existe un "findOne(id)" aca,
// a proposito, para que esta pantalla nunca pueda tocar otra institucion
// que la propia (ver tenant.controller.ts).
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  // "tenants" NO tiene Row-Level Security (ver rls-policies.sql) — el
  // aislamiento aca lo da, en cambio, que SIEMPRE se busca por el
  // tenantId resuelto por el Host del request, nunca por uno recibido del
  // cliente.
  async getCurrent() {
    const tenantId = this.tenantContext.requireTenantId();
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('No se encontro el tenant activo.');
    }
    return tenant;
  }

  async update(dto: UpdateTenantDto) {
    const tenantId = this.tenantContext.requireTenantId();
    const current = await this.getCurrent();

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        // Se MEZCLA con la marca existente en vez de reemplazarla entera:
        // si alguien solo actualiza el color de fondo, no queremos perder
        // el logo que ya tenia cargado.
        ...(dto.branding !== undefined && {
          branding: {
            ...(current.branding as object),
            ...dto.branding,
          } as Prisma.InputJsonValue,
        }),
      },
    });
  }

  // Version PUBLICA (sin autenticacion) para el home de cada institucion
  // (ver apps/web/app/page.tsx): solo expone lo que es seguro mostrarle a
  // cualquiera ANTES de iniciar sesion (nombre y marca), nunca el resto de
  // las columnas de "tenants" (plan comercial, etc.).
  async getPublicInfo(): Promise<{ name: string; branding: unknown } | null> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      // Sin tenant resuelto (ej. se entro por el dominio raiz de la
      // plataforma, no por el subdominio de ninguna institucion): el
      // frontend interpreta "null" como "mostrar el home generico de
      // Stoka LMS con el boton de inscribir una institucion nueva".
      return null;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, branding: true },
    });
    return tenant;
  }
}
