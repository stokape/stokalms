// ============================================================================
// tenant-domain.service.ts — Alta y verificacion de dominios PROPIOS de LA
// institucion activa (ej. "campus.institutosanmartin.edu.pe"), a diferencia
// del subdominio automatico que ya crea tenant-registration.service.ts al
// aprobar una institucion ("sanmartin.stokalms.com").
//
// Es autoservicio de CADA institucion sobre SU PROPIO tenant — nunca sobre
// otro: igual que tenant.service.ts, no existe ningun metodo que reciba un
// tenantId por parametro; siempre se opera sobre
// "tenantContext.requireTenantId()" (el tenant resuelto por el Host del
// request, ver tenant-context.middleware.ts), y el controller exige el
// permiso "tenant:edit" (ver tenant-domain.controller.ts) — que hoy SOLO
// tienen los roles "Super Admin" y "Administrador de entidad" (ver
// prisma/seed.js, SYSTEM_ROLES): ningun otro rol de un tenant puede tocar
// esto, y ningun tenant puede tocar el dominio de OTRO.
//
// Reclamar un dominio sin probar nada seria ademas un hueco de seguridad
// real (alguien podria decir "mi institucion es tal.gob.pe" sin serlo) —
// por eso todo dominio nuevo inicia SIN verificar (ver el default de
// TenantDomain.verified, schema.prisma) y tenant-context.middleware.ts lo
// ignora hasta que verifyDomain() confirme, via DNS, que quien lo agrego de
// verdad controla ese dominio: se le pide publicar un registro TXT con un
// token aleatorio que solo nosotros generamos.
// ============================================================================

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { resolveTxt } from 'node:dns/promises';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateTenantDomainDto } from './dto/create-tenant-domain.dto';

// Mismo estilo que "google-site-verification=..." u otros servicios que
// prueban propiedad de un dominio por DNS en vez de por acceso al servidor
// web: no hace falta que el dominio ya apunte a la plataforma para
// verificarlo, alcanza con el panel de DNS.
const TXT_PREFIX = 'stoka-verify=';

@Injectable()
export class TenantDomainService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  // "tenant_domains" no tiene Row-Level Security (es dato DE la plataforma,
  // no de un tenant en particular — ver la nota al inicio de
  // rls-policies.sql), asi que el aislamiento aca lo da exclusivamente
  // filtrar SIEMPRE por el tenantId resuelto por el Host del request, nunca
  // por uno recibido del cliente — mismo criterio que tenant.service.ts.
  async listForCurrentTenant() {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.tenantDomain.findMany({
      where: { tenantId },
      select: {
        id: true,
        domain: true,
        isPrimary: true,
        verified: true,
        verificationToken: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addDomain(dto: CreateTenantDomainDto) {
    const tenantId = this.tenantContext.requireTenantId();

    const existing = await this.prisma.tenantDomain.findUnique({ where: { domain: dto.domain } });
    if (existing) {
      throw new ConflictException(`El dominio "${dto.domain}" ya está en uso.`);
    }

    const verificationToken = randomBytes(24).toString('hex');
    const created = await this.prisma.tenantDomain.create({
      data: { tenantId, domain: dto.domain, isPrimary: false, verified: false, verificationToken },
    });

    return { ...created, ...this.txtInstructions(created.domain, verificationToken) };
  }

  async verifyDomain(domainId: string) {
    const tenantDomain = await this.findOwnDomainOrThrow(domainId);
    if (tenantDomain.verified) {
      return tenantDomain;
    }
    if (!tenantDomain.verificationToken) {
      // No deberia pasar (todo dominio sin verificar tiene token), pero si
      // pasa no hay contra que comparar.
      throw new ConflictException('Este dominio no tiene un token de verificación pendiente.');
    }

    const recordName = `_stoka-verify.${tenantDomain.domain}`;
    const expected = `${TXT_PREFIX}${tenantDomain.verificationToken}`;

    let found = false;
    try {
      // Cada elemento de resolveTxt es un array de "chunks" (DNS parte los
      // TXT largos en fragmentos de 255 caracteres) — hay que unirlos antes
      // de comparar.
      const records = await resolveTxt(recordName);
      found = records.some((chunks) => chunks.join('').trim() === expected);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== 'ENOTFOUND' && code !== 'ENODATA') {
        throw err;
      }
      // ENOTFOUND/ENODATA = el registro todavia no existe (o no propago) —
      // se trata igual que "no encontrado", no como una falla del servidor.
    }

    if (!found) {
      throw new ConflictException(
        `Todavía no se encontró el registro TXT esperado en "${recordName}". Los cambios de DNS pueden tardar varios minutos (a veces horas) en propagarse — prueba de nuevo en un rato.`,
      );
    }

    return this.prisma.tenantDomain.update({
      where: { id: domainId },
      data: { verified: true, verificationToken: null },
    });
  }

  async removeDomain(domainId: string) {
    const tenantDomain = await this.findOwnDomainOrThrow(domainId);
    if (tenantDomain.isPrimary) {
      throw new ConflictException(
        'No se puede eliminar el dominio principal de tu institución — es el único con el que tu gente puede entrar.',
      );
    }
    await this.prisma.tenantDomain.delete({ where: { id: domainId } });
    return { ok: true };
  }

  private txtInstructions(domain: string, token: string) {
    return {
      txtRecordName: `_stoka-verify.${domain}`,
      txtRecordValue: `${TXT_PREFIX}${token}`,
    };
  }

  // "encontrado y ademas mio": nunca alcanza con que el domainId exista,
  // tiene que pertenecer al tenant activo — asi es imposible que alguien de
  // la institucion A verifique/borre un dominio de la institucion B con
  // solo adivinar/probar un UUID ajeno.
  private async findOwnDomainOrThrow(domainId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const tenantDomain = await this.prisma.tenantDomain.findUnique({ where: { id: domainId } });
    if (!tenantDomain || tenantDomain.tenantId !== tenantId) {
      throw new NotFoundException('Dominio no encontrado.');
    }
    return tenantDomain;
  }
}
