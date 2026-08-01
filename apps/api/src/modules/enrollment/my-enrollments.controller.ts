// ============================================================================
// my-enrollments.controller.ts — "GET /api/v1/enrollments/mine": el punto
// de entrada de autoservicio de CUALQUIER persona autenticada para ver SUS
// PROPIAS matriculas (curso, seccion, estado), sin necesitar el permiso
// administrativo "enrollment:view" (ver la nota extensa en
// enrollment.service.ts, metodo "findMine").
//
// Por que un controller aparte y no un metodo mas en EnrollmentController:
// EnrollmentController esta anidado bajo "/courses/:courseId/sections/:sectionId"
// (necesita esos parametros para que PermissionsGuard evalue el permiso en
// el curso correcto); esta ruta es plana ("/enrollments/mine") y
// deliberadamente NO lleva PermissionsGuard, solo JwtAuthGuard: el propio
// "userTenantId" de quien pregunta es el unico filtro que aplica.
// ============================================================================

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { EnrollmentService } from './enrollment.service';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class MyEnrollmentsController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.enrollmentService.findMine(user);
  }
}
