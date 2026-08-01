// ============================================================================
// rbac-demo.controller.ts — Endpoint TEMPORAL, solo para comprobar que la
// cadena completa de autenticacion + permisos funciona de punta a punta.
//
// Se debe BORRAR este archivo (y sus rutas "/rbac-demo/...") cuando exista
// el modulo Academico real (ver docs/architecture/06-roadmap.md, Fase 1),
// que expondra "/courses" con la misma proteccion pero con logica de
// negocio real detras, no una respuesta fija de prueba.
// ============================================================================

import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermission } from './require-permission.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';

@Controller('rbac-demo')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RbacDemoController {
  @RequirePermission('course', 'view')
  @Get('courses')
  listCourses(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: `Hola ${user.fullName}: tu token y tu permiso "course:view" son validos.`,
    };
  }

  @RequirePermission('course', 'delete')
  @Delete('courses/:courseId')
  deleteCourse(@Param('courseId') courseId: string) {
    return { message: `(demo) se habria borrado el curso ${courseId}.` };
  }
}
