// ============================================================================
// certificate.service.ts — Emision, consulta, revocacion y verificacion
// publica de certificados. Ver docs/architecture/04-flujos-criticos.md,
// seccion 4.3, y la nota de simplificacion del MVP en
// certificate-renderer.service.ts (emision sincrona, sin cola todavia).
// ============================================================================

import { randomBytes } from 'node:crypto';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { StorageService } from '../../common/storage/storage.service';
import { CasbinService } from '../../rbac/casbin.service';
import { AuthenticatedUser } from '../../auth/auth.service';
import { CertificateRendererService } from './certificate-renderer.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';

@Injectable()
export class CertificateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly storage: StorageService,
    private readonly renderer: CertificateRendererService,
    private readonly casbin: CasbinService,
    private readonly configService: ConfigService,
  ) {}

  async issue(enrollmentId: string, dto: IssueCertificateDto) {
    const tenantId = this.tenantContext.requireTenantId();

    const { enrollment, template } = await this.prisma.withTenant(tenantId, async (tx) => {
      const enrollment = await tx.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          userTenant: { include: { user: true } },
          section: { include: { course: true } },
          certificates: { where: { revoked: false } },
        },
      });
      if (!enrollment) {
        throw new NotFoundException(`No existe la matricula "${enrollmentId}".`);
      }
      // "completed" es lo que dispara la evaluacion de criterios de emision
      // en el flujo documentado (ver Enrollment.status en schema.prisma) —
      // aqui, sin cron/worker todavia (ver la nota de simplificacion en
      // certificate-renderer.service.ts), es quien emite a mano el que debe
      // confirmar que la matricula ya esta en ese estado.
      if (enrollment.status !== 'completed') {
        throw new ConflictException(
          `Esta matricula esta en estado "${enrollment.status}", no "completed" — solo se pueden emitir certificados para matriculas completadas.`,
        );
      }
      // Un estudiante no deberia terminar con dos certificados VIGENTES para
      // la misma matricula (ver la nota de "revoked, nunca se borra" en
      // Certificate en schema.prisma) — si hace falta reemitir, primero hay
      // que revocar el anterior explicitamente (PATCH .../revoke).
      if (enrollment.certificates.length > 0) {
        throw new ConflictException(
          'Esta matricula ya tiene un certificado vigente. Revocalo primero si necesitas emitir uno nuevo.',
        );
      }

      const template = await tx.certificateTemplate.findUnique({ where: { id: dto.templateId } });
      if (!template) {
        throw new NotFoundException(`No existe la plantilla de certificado "${dto.templateId}".`);
      }

      return { enrollment, template };
    });

    const verificationCode = await this.generateUniqueVerificationCode();
    const verificationUrl = `${this.configService.get<string>('apiPublicUrl')}/verify/${verificationCode}`;
    const issuedAt = new Date();

    const pdfBuffer = await this.renderer.render(template.htmlTemplate, {
      studentName: enrollment.userTenant.user.fullName,
      courseTitle: enrollment.section.course.title,
      issueDate: issuedAt,
      verificationCode,
      verificationUrl,
    });

    const storageKey = `certificates/${tenantId}/${verificationCode}.pdf`;
    await this.storage.upload(storageKey, pdfBuffer, 'application/pdf');

    const certificate = await this.prisma.withTenant(tenantId, (tx) =>
      tx.certificate.create({
        data: {
          tenantId,
          enrollmentId,
          templateId: dto.templateId,
          verificationCode,
          pdfUrl: storageKey, // Ver la nota en storage.service.ts: es la KEY dentro del bucket, no una URL publica permanente.
          issuedAt,
        },
      }),
    );

    return this.toResponse(certificate);
  }

  async findAllByEnrollment(enrollmentId: string, user: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();
    const enrollment = await this.prisma.withTenant(tenantId, (tx) =>
      tx.enrollment.findUnique({ where: { id: enrollmentId }, select: { userTenantId: true } }),
    );
    if (!enrollment) {
      throw new NotFoundException(`No existe la matricula "${enrollmentId}".`);
    }
    await this.assertCanViewCertificatesOf(enrollment.userTenantId, user);

    const certificates = await this.prisma.withTenant(tenantId, (tx) =>
      tx.certificate.findMany({ where: { enrollmentId }, orderBy: { issuedAt: 'desc' } }),
    );
    return Promise.all(certificates.map((c) => this.toResponse(c)));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();
    const certificate = await this.prisma.withTenant(tenantId, (tx) =>
      tx.certificate.findUnique({ where: { id }, include: { enrollment: { select: { userTenantId: true } } } }),
    );
    if (!certificate) {
      throw new NotFoundException(`No existe el certificado "${id}".`);
    }
    await this.assertCanViewCertificatesOf(certificate.enrollment.userTenantId, user);
    return this.toResponse(certificate);
  }

  // "certificate:view" (staff: ve cualquier matricula del tenant) y
  // "certificate:view_own" (estudiante: solo la matricula que es SUYA, ver
  // seed.js) son dos permisos con un "O" logico entre ellos — el mismo
  // patron ya usado en GradebookController.getGrades (ver el comentario
  // extenso alli): PermissionsGuard evalua un solo permiso por ruta, asi
  // que estas dos rutas NO llevan @RequirePermission y este metodo hace la
  // verificacion el mismo, con esta doble condicion.
  //
  // Sin esto, un Estudiante con el "certificate:view" ORIGINAL (amplio, sin
  // distincion de dueño) podria pedir los certificados de CUALQUIER
  // matricula del tenant con solo conocer su UUID — no es una fuga teorica:
  // se detecto revisando el catalogo de permisos sembrado, donde Estudiante
  // ya tenia "certificate:view" sin ningun filtro de pertenencia.
  private async assertCanViewCertificatesOf(
    enrollmentUserTenantId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const canViewAll = await this.casbin.can(user.userId, user.tenantId, 'certificate', 'view');
    if (canViewAll) return;

    const canViewOwn = await this.casbin.can(user.userId, user.tenantId, 'certificate', 'view_own');
    if (canViewOwn && enrollmentUserTenantId === user.userTenantId) return;

    throw new ForbiddenException('No tienes permiso para ver los certificados de esta matricula.');
  }

  async revoke(id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const certificate = await this.prisma.withTenant(tenantId, (tx) =>
      tx.certificate.findUnique({ where: { id } }),
    );
    if (!certificate) {
      throw new NotFoundException(`No existe el certificado "${id}".`);
    }
    // Nunca se borra (ver la nota extensa en Certificate en schema.prisma):
    // un certificado revocado sigue siendo un registro historico consultable
    // en la verificacion publica, solo que marcado como invalido.
    const revoked = await this.prisma.withTenant(tenantId, (tx) =>
      tx.certificate.update({ where: { id }, data: { revoked: true } }),
    );
    return this.toResponse(revoked);
  }

  // --------------------------------------------------------------------
  // verifyPublic: SIN autenticacion, SIN tenant conocido de antemano — ver
  // la nota extensa en rls-policies.sql sobre "find_certificate_tenant".
  // Devuelve deliberadamente el MINIMO: nunca la nota, ni el email, ni
  // ningun otro dato del estudiante mas alla de su nombre (ver
  // docs/architecture/04-flujos-criticos.md, seccion 4.3: "sin exponer
  // notas ni datos sensibles").
  // --------------------------------------------------------------------
  async verifyPublic(code: string) {
    const rows = await this.prisma.$queryRaw<{ find_certificate_tenant: string | null }[]>`
      SELECT find_certificate_tenant(${code})
    `;
    const tenantId = rows[0]?.find_certificate_tenant;
    if (!tenantId) {
      throw new NotFoundException('No existe ningun certificado con ese codigo de verificacion.');
    }

    return this.prisma.withTenant(tenantId, async (tx) => {
      const certificate = await tx.certificate.findUniqueOrThrow({
        where: { verificationCode: code },
        include: {
          tenant: true,
          enrollment: {
            include: { userTenant: { include: { user: true } }, section: { include: { course: true } } },
          },
        },
      });

      return {
        valid: !certificate.revoked,
        revoked: certificate.revoked,
        studentName: certificate.enrollment.userTenant.user.fullName,
        courseTitle: certificate.enrollment.section.course.title,
        institution: certificate.tenant.name,
        issuedAt: certificate.issuedAt,
      };
    });
  }

  private async toResponse(certificate: { id: string; pdfUrl: string; [key: string]: unknown }) {
    const downloadUrl = await this.storage.getPresignedDownloadUrl(certificate.pdfUrl);
    return { ...certificate, downloadUrl };
  }

  // El codigo de verificacion es UNICO EN TODA LA PLATAFORMA (no solo
  // dentro del tenant, ver la nota en Certificate.verificationCode en
  // schema.prisma), porque la URL publica no lleva contexto de tenant en la
  // ruta. 16 caracteres hexadecimales (8 bytes al azar) hacen que una
  // colision sea astronomicamente improbable, pero el loop de reintento
  // deja el caso cubierto igual en vez de asumirlo por las buenas.
  //
  // IMPORTANTE: esta comprobacion NO puede hacerse con un "findUnique"
  // normal — "certificates" tiene RLS forzada (ver rls-policies.sql), y
  // aqui todavia no hay un tenant activo fijado en la transaccion (recien
  // se esta por crear el certificado). Sin un tenant fijado,
  // "app_current_tenant()" es NULL y la politica de RLS, fiel a su diseño
  // "fail closed", no devuelve NINGUNA fila — un "findUnique" comun SIEMPRE
  // daria "no existe", incluso si el codigo ya esta usado por OTRO tenant,
  // dejando pasar una colision real. Por eso se reutiliza la misma funcion
  // SECURITY DEFINER que usa la verificacion publica (find_certificate_tenant):
  // ve a traves de todos los tenants para esta unica pregunta ("¿esta
  // usado?"), sin exponer nada del certificado en si.
  private async generateUniqueVerificationCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(8).toString('hex');
      const rows = await this.prisma.$queryRaw<{ find_certificate_tenant: string | null }[]>`
        SELECT find_certificate_tenant(${code})
      `;
      if (!rows[0]?.find_certificate_tenant) {
        return code;
      }
    }
    throw new ConflictException('No se pudo generar un codigo de verificacion unico, intenta de nuevo.');
  }
}
