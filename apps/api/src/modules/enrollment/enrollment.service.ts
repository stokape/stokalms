// ============================================================================
// enrollment.service.ts — Logica de negocio de la matricula individual (ver
// docs/architecture/04-flujos-criticos.md, seccion 4.1).
// ============================================================================

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthenticatedUser } from '../../auth/auth.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(courseId: string, sectionId: string, dto: CreateEnrollmentDto) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const section = await tx.section.findUnique({ where: { id: sectionId } });
      if (!section || section.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la seccion "${sectionId}" en el curso "${courseId}".`,
        );
      }

      // Buscar-o-crear la persona por email: el mismo patron de
      // aprovisionamiento que usa el login (ver auth.service.ts,
      // "findOrProvisionUser"), pero disparado aqui por un coordinador en
      // vez de por un inicio de sesion real — el estudiante puede
      // matricularse ANTES de haber iniciado sesion alguna vez.
      const user = await tx.user.upsert({
        where: { email: dto.email },
        update: {},
        create: { email: dto.email, fullName: dto.fullName ?? dto.email },
      });

      const userTenant = await tx.userTenant.upsert({
        where: { userId_tenantId: { userId: user.id, tenantId } },
        update: {},
        create: { userId: user.id, tenantId, status: 'active' },
      });

      const existing = await tx.enrollment.findUnique({
        where: { sectionId_userTenantId: { sectionId, userTenantId: userTenant.id } },
      });

      if (existing?.status === 'active') {
        throw new ConflictException(
          `${dto.email} ya esta matriculado activamente en esta seccion.`,
        );
      }

      // Cupo maximo: "capacity = 0" se interpreta como "sin limite" (ver
      // CreateSectionDto, valor por defecto). Solo se cuenta contra
      // estudiantes ACTIVOS: alguien que se retiro no deberia seguir
      // "ocupando" un cupo. Este chequeo aplica TANTO a una matricula
      // nueva COMO a reactivar una previamente retirada (existing.status
      // === "dropped") — antes de esta correccion, reactivar se saltaba el
      // limite de cupo por completo, detectado probando de verdad: una
      // seccion con capacidad 1 termino con 2 matriculas activas.
      if (section.capacity > 0) {
        const activeCount = await tx.enrollment.count({
          where: { sectionId, status: 'active' },
        });
        if (activeCount >= section.capacity) {
          throw new ConflictException('La seccion alcanzo su capacidad maxima.');
        }
      }

      // Si la persona ya estuvo matriculada antes en esta seccion y fue
      // "dropped" (retirada), un nuevo intento de matricularla la
      // REACTIVA en vez de crear una fila duplicada — preserva el
      // historial (ver el comentario en update-enrollment-status.dto.ts)
      // en lugar de acumular registros redundantes.
      if (existing) {
        return tx.enrollment.update({
          where: { id: existing.id },
          data: { status: 'active' },
        });
      }

      return tx.enrollment.create({
        data: { tenantId, sectionId, userTenantId: userTenant.id, status: 'active' },
      });
    });
  }

  async findAllBySection(courseId: string, sectionId: string) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const section = await tx.section.findUnique({ where: { id: sectionId } });
      if (!section || section.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la seccion "${sectionId}" en el curso "${courseId}".`,
        );
      }

      const enrollments = await tx.enrollment.findMany({
        where: { sectionId },
        include: { userTenant: { include: { user: true } } },
        orderBy: { enrolledAt: 'asc' },
      });

      // Se "aplana" la respuesta (email/nombre directo, sin anidar
      // userTenant.user) porque a quien consume este endpoint (una
      // pantalla de lista de matriculados) no le importa la estructura
      // interna de nuestras tablas — solo quien es cada estudiante y su
      // estado.
      return enrollments.map((e) => ({
        id: e.id,
        status: e.status,
        enrolledAt: e.enrolledAt,
        student: {
          userId: e.userTenant.user.id,
          email: e.userTenant.user.email,
          fullName: e.userTenant.user.fullName,
        },
      }));
    });
  }

  // "Mis matriculas": el punto de entrada de autoservicio para un
  // Estudiante (o cualquier persona), que NO tiene "enrollment:view" (ese
  // permiso es de Coordinador/Docente para ADMINISTRAR matriculas de
  // otros) — ver un servicio (curso + seccion) donde YO estoy matriculado
  // no deberia depender de un permiso administrativo, es simplemente MI
  // propio dato. Por eso este metodo no pasa por PermissionsGuard (ver
  // my-enrollments.controller.ts): esta acotado por construccion a
  // "userTenantId = el de quien pregunta", nunca a otra persona.
  async findMine(user: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const enrollments = await tx.enrollment.findMany({
        where: { userTenantId: user.userTenantId },
        include: { section: { include: { course: true } } },
        orderBy: { enrolledAt: 'desc' },
      });

      return enrollments.map((e) => ({
        id: e.id,
        status: e.status,
        enrolledAt: e.enrolledAt,
        course: { id: e.section.course.id, code: e.section.course.code, title: e.section.course.title },
        section: { id: e.section.id, name: e.section.name },
      }));
    });
  }

  async updateStatus(
    courseId: string,
    sectionId: string,
    id: string,
    dto: UpdateEnrollmentStatusDto,
  ) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const enrollment = await tx.enrollment.findUnique({ where: { id } });
      // Se verifica sectionId Y, a traves de la seccion, courseId — mismo
      // motivo que en section.service.ts: que el permiso otorgado para
      // ESTE curso/seccion en la URL no se use para tocar una matricula de
      // otra seccion con un id adivinado.
      if (!enrollment || enrollment.sectionId !== sectionId) {
        throw new NotFoundException(`No existe la matricula "${id}" en esta seccion.`);
      }
      const section = await tx.section.findUnique({ where: { id: sectionId } });
      if (!section || section.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la seccion "${sectionId}" en el curso "${courseId}".`,
        );
      }

      return tx.enrollment.update({ where: { id }, data: { status: dto.status } });
    });
  }
}
