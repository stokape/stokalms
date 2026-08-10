// ============================================================================
// academic-progress.controller.ts — "Avance" de una matrícula puntual. No
// se anida bajo curso/sección: "enrollmentId" ya identifica de forma única
// (y protegida por RLS vía tenant) todo lo que hace falta, igual que
// certificate.controller.ts y student-note.controller.ts.
// ============================================================================

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { AcademicProgressService } from './academic-progress.service';

@Controller('enrollments/:enrollmentId/progress')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AcademicProgressController {
  constructor(private readonly academicProgressService: AcademicProgressService) {}

  @RequirePermission('student_progress', 'view')
  @Get()
  getForEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.academicProgressService.getForEnrollment(enrollmentId);
  }
}
