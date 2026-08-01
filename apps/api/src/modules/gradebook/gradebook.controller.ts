// ============================================================================
// gradebook.controller.ts — Publicacion de notas y consulta de la nota
// final de curso.
// ============================================================================

import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { GradebookService } from './gradebook.service';

@Controller('courses/:courseId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GradebookController {
  constructor(private readonly gradebookService: GradebookService) {}

  @RequirePermission('grade', 'publish')
  @Post('gradebook/publish')
  publish(@Param('courseId') courseId: string) {
    return this.gradebookService.publish(courseId);
  }

  // Sin @RequirePermission aqui A PROPOSITO: esta ruta la puede llamar
  // tanto quien tiene "grade:view" (ve a todo el curso) como quien solo
  // tiene "grade:view_own" (ve unicamente su propia nota) — son DOS
  // permisos distintos con un "O" logico entre ellos, algo que
  // PermissionsGuard (pensado para un solo permiso por ruta) no expresa.
  // GradebookService.getGrades hace ese chequeo el mismo, y filtra la
  // respuesta segun corresponda (ver el comentario alli).
  @Get('grades')
  getGrades(@Param('courseId') courseId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.gradebookService.getGrades(courseId, user);
  }
}
