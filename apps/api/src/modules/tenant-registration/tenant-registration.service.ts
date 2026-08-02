// ============================================================================
// tenant-registration.service.ts — Alta de instituciones nuevas, PENDIENTE
// de revision manual (ver la nota extensa en TenantRegistrationRequest,
// schema.prisma, sobre por que se eligio este modelo y no autoservicio
// instantaneo).
// ============================================================================

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CasbinService } from '../../rbac/casbin.service';
import { CreateTenantRegistrationDto } from './dto/create-tenant-registration.dto';
import { RejectTenantRegistrationDto } from './dto/reject-tenant-registration.dto';

@Injectable()
export class TenantRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly casbin: CasbinService,
  ) {}

  async create(dto: CreateTenantRegistrationDto) {
    // "tenant_registration_requests" no tiene Row-Level Security (ver la
    // nota en rls-policies.sql) — esta consulta y la de abajo corren con
    // el cliente normal, sin pasar por "withTenant", porque todavia no hay
    // NINGUN tenant en juego.
    const existingDomain = await this.prisma.tenantDomain.findUnique({
      where: { domain: this.buildDomain(dto.desiredSubdomain) },
    });
    if (existingDomain) {
      throw new ConflictException(
        `El subdominio "${dto.desiredSubdomain}" ya esta en uso por otra institucion.`,
      );
    }

    const existingPendingRequest = await this.prisma.tenantRegistrationRequest.findFirst({
      where: { desiredSubdomain: dto.desiredSubdomain, status: 'pending' },
    });
    if (existingPendingRequest) {
      throw new ConflictException(
        `Ya hay una solicitud pendiente para el subdominio "${dto.desiredSubdomain}".`,
      );
    }

    return this.prisma.tenantRegistrationRequest.create({
      data: {
        institutionName: dto.institutionName,
        desiredSubdomain: dto.desiredSubdomain,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        message: dto.message,
      },
    });
  }

  async findAll(status?: string) {
    return this.prisma.tenantRegistrationRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    const request = await this.findPendingOrThrow(id);
    const domain = this.buildDomain(request.desiredSubdomain);

    // Revalidacion de ultimo momento: entre que se creo la solicitud y que
    // alguien la aprueba puede haber pasado bastante tiempo, en el que otra
    // solicitud con el mismo subdominio podria haberse aprobado primero.
    const existingDomain = await this.prisma.tenantDomain.findUnique({ where: { domain } });
    if (existingDomain) {
      throw new ConflictException(`El dominio "${domain}" ya esta en uso por otra institucion.`);
    }

    // El rol "Administrador de entidad" es uno de los roles DEL SISTEMA
    // sembrados por prisma/seed.js (tenantId = null, compartido por toda
    // la plataforma) — no se crea uno nuevo por institucion.
    const adminRole = await this.prisma.role.findFirst({
      where: { name: 'Administrador de entidad', isSystemRole: true, tenantId: null },
    });
    if (!adminRole) {
      throw new ConflictException(
        'No se encontro el rol "Administrador de entidad" — corre "npm run prisma:seed" primero.',
      );
    }

    const tenant = await this.prisma.tenant.create({ data: { name: request.institutionName } });
    await this.prisma.tenantDomain.create({
      data: { tenantId: tenant.id, domain, isPrimary: true },
    });

    // "users" tampoco tiene RLS (identidad global, ver rls-policies.sql):
    // se busca-o-crea por email igual que en cualquier otro flujo de
    // aprovisionamiento (auth.service.ts, enrollment.service.ts).
    const user = await this.prisma.user.upsert({
      where: { email: request.contactEmail },
      update: {},
      create: { email: request.contactEmail, fullName: request.contactName },
    });

    // "user_tenants" y "user_roles" SI tienen RLS — recien AHORA existe un
    // tenantId (el que se acaba de crear arriba) para fijar con
    // "withTenant", igual que en cualquier otra escritura de negocio.
    await this.prisma.withTenant(tenant.id, async (tx) => {
      const userTenant = await tx.userTenant.create({
        data: { userId: user.id, tenantId: tenant.id, status: 'active' },
      });
      await tx.userRole.create({
        data: { tenantId: tenant.id, userTenantId: userTenant.id, roleId: adminRole.id },
      });
    });

    await this.prisma.tenantRegistrationRequest.update({
      where: { id },
      data: { status: 'approved', reviewedAt: new Date(), createdTenantId: tenant.id },
    });

    // Sin esto, el nuevo Administrador de entidad tendria que esperar a
    // que alguien REINICIE el backend para que su rol recien creado surta
    // efecto (ver la nota en CasbinService sobre por que las politicas se
    // cargan una vez al arrancar) — recargar aca lo deja listo para
    // iniciar sesion de inmediato.
    await this.casbin.reload();

    return { tenantId: tenant.id, domain };
  }

  async reject(id: string, dto: RejectTenantRegistrationDto) {
    await this.findPendingOrThrow(id);
    return this.prisma.tenantRegistrationRequest.update({
      where: { id },
      data: { status: 'rejected', reviewedAt: new Date(), rejectionReason: dto.reason },
    });
  }

  private async findPendingOrThrow(id: string) {
    const request = await this.prisma.tenantRegistrationRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`No existe la solicitud "${id}".`);
    }
    if (request.status !== 'pending') {
      throw new ConflictException(
        `Esta solicitud ya fue ${request.status === 'approved' ? 'aprobada' : 'rechazada'} anteriormente.`,
      );
    }
    return request;
  }

  private buildDomain(subdomain: string): string {
    const rootDomain = this.configService.get<string>('platformRootDomain');
    return `${subdomain}.${rootDomain}`;
  }
}
