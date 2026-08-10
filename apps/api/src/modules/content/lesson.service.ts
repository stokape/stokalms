// ============================================================================
// lesson.service.ts — Lógica de negocio de las Lecciones dentro de un
// Módulo. Mismo patrón que module.service.ts, un nivel más abajo: valida
// que el módulo padre exista Y pertenezca al curso de la URL antes de tocar
// nada (ver la nota extensa en module.service.ts, findOne).
// ============================================================================

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthenticatedUser } from '../../auth/auth.service';
import { AiService } from '../../common/ai/ai.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly aiService: AiService,
  ) {}

  // Reutilizado por ResourceService (necesita confirmar que la lección
  // padre existe y pertenece al módulo/curso de la URL antes de adjuntarle
  // un archivo) — ver resource.service.ts.
  async findOne(courseId: string, moduleId: string, id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const lesson = await this.prisma.withTenant(tenantId, (tx) =>
      tx.lesson.findUnique({ where: { id }, include: { module: true } }),
    );
    if (!lesson || lesson.moduleId !== moduleId || lesson.module.courseId !== courseId) {
      throw new NotFoundException(`No existe la lección "${id}" en ese módulo/curso.`);
    }
    const { module: _module, ...lessonWithoutModule } = lesson;
    return lessonWithoutModule;
  }

  async create(courseId: string, moduleId: string, dto: CreateLessonDto) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const module = await tx.module.findUnique({ where: { id: moduleId } });
      if (!module || module.courseId !== courseId) {
        throw new NotFoundException(`No existe el módulo "${moduleId}" en el curso "${courseId}".`);
      }

      return tx.lesson.create({
        data: { tenantId, moduleId, title: dto.title, content: dto.content ?? '' },
      });
    });
  }

  async findAllByModule(courseId: string, moduleId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const module = await tx.module.findUnique({ where: { id: moduleId } });
      if (!module || module.courseId !== courseId) {
        throw new NotFoundException(`No existe el módulo "${moduleId}" en el curso "${courseId}".`);
      }
      return tx.lesson.findMany({ where: { moduleId }, orderBy: { title: 'asc' } });
    });
  }

  async update(courseId: string, moduleId: string, id: string, dto: UpdateLessonDto) {
    await this.findOne(courseId, moduleId, id);
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.lesson.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.content !== undefined && { content: dto.content }),
        },
      }),
    );
  }

  // Registra que quien pregunta abrio esta leccion — pero SOLO si es un
  // estudiante con matricula ACTIVA en este curso (via cualquier seccion):
  // un Docente/Coordinador abriendo la misma pantalla para editar contenido
  // no es "avance" de nadie, y no debe contar. Silenciosamente no hace nada
  // si quien pregunta no es alumno de este curso — no es un error, solo no
  // aplica (ver academic-progress.service.ts, que consume estos registros).
  async registrarVista(courseId: string, moduleId: string, id: string, user: AuthenticatedUser) {
    await this.findOne(courseId, moduleId, id);
    const tenantId = this.tenantContext.requireTenantId();

    await this.prisma.withTenant(tenantId, async (tx) => {
      const enrollment = await tx.enrollment.findFirst({
        where: { userTenantId: user.userTenantId, status: 'active', section: { courseId } },
      });
      if (!enrollment) return;

      // Upsert (no create simple): la SEGUNDA vez que la misma persona abre
      // la misma leccion no debe fallar por el "@@unique" del modelo, ni
      // sumar una fila nueva — solo importa la PRIMERA vez (ver
      // schema.prisma, LessonView).
      await tx.lessonView.upsert({
        where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: id } },
        update: {},
        create: { tenantId, enrollmentId: enrollment.id, lessonId: id },
      });
    });
  }

  // "Funcionalidades de IA" (plan Pro, ver lib/pricing.ts): banco de
  // preguntas BORRADOR a partir del contenido de esta lección — nunca se
  // guardan solas como Assessment/Question reales (ver ai.service.ts):
  // el Docente las revisa y las carga a mano si le sirven, mismo criterio
  // de "la IA propone, la persona decide" que el resto de la industria.
  async generateQuestions(courseId: string, moduleId: string, id: string, count?: number) {
    const lesson = await this.findOne(courseId, moduleId, id);
    if (!lesson.content || lesson.content.trim().length < 50) {
      throw new BadRequestException(
        'Esta lección todavía no tiene suficiente contenido de texto para generar preguntas.',
      );
    }
    return this.aiService.generateQuestionsFromText(lesson.content, count);
  }

  async remove(courseId: string, moduleId: string, id: string) {
    await this.findOne(courseId, moduleId, id);
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, (tx) => tx.lesson.delete({ where: { id } }));
    return { deleted: true };
  }
}
