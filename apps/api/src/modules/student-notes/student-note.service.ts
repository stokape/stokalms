// ============================================================================
// student-note.service.ts — Lógica de negocio de las anotaciones de
// desempeño. No se anida bajo curso/sección: "enrollmentId" ya identifica
// de forma única (y ya está protegido por RLS vía tenant) todo lo que hace
// falta, igual que certificate.service.ts.
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthenticatedUser } from '../../auth/auth.service';
import { CreateStudentNoteDto } from './dto/create-student-note.dto';

@Injectable()
export class StudentNoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private async requireEnrollment(enrollmentId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const enrollment = await tx.enrollment.findUnique({ where: { id: enrollmentId } });
      if (!enrollment) {
        throw new NotFoundException(`No existe la matrícula "${enrollmentId}".`);
      }
      return enrollment;
    });
  }

  async findAllByEnrollment(enrollmentId: string) {
    await this.requireEnrollment(enrollmentId);
    const tenantId = this.tenantContext.requireTenantId();

    const notes = await this.prisma.withTenant(tenantId, (tx) =>
      tx.studentNote.findMany({
        where: { enrollmentId },
        include: { author: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    );

    return notes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt,
      author: { fullName: n.author.user.fullName },
    }));
  }

  async create(enrollmentId: string, user: AuthenticatedUser, dto: CreateStudentNoteDto) {
    await this.requireEnrollment(enrollmentId);
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.studentNote.create({
        data: { tenantId, enrollmentId, authorId: user.userTenantId, body: dto.body },
      }),
    );
  }

  async remove(enrollmentId: string, id: string) {
    await this.requireEnrollment(enrollmentId);
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const note = await tx.studentNote.findUnique({ where: { id } });
      if (!note || note.enrollmentId !== enrollmentId) {
        throw new NotFoundException(`No existe la anotación "${id}" en esa matrícula.`);
      }
      await tx.studentNote.delete({ where: { id } });
      return { deleted: true };
    });
  }
}
