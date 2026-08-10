// ============================================================================
// student-note.controller.ts — Rutas HTTP de las anotaciones de desempeño
// por alumno, anidadas bajo "/enrollments/:enrollmentId/notes" (no bajo
// curso/sección: mismo criterio que certificate.controller.ts).
// ============================================================================

import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { StudentNoteService } from './student-note.service';
import { CreateStudentNoteDto } from './dto/create-student-note.dto';

@Controller('enrollments/:enrollmentId/notes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StudentNoteController {
  constructor(private readonly studentNoteService: StudentNoteService) {}

  @RequirePermission('student_note', 'view')
  @Get()
  findAll(@Param('enrollmentId') enrollmentId: string) {
    return this.studentNoteService.findAllByEnrollment(enrollmentId);
  }

  @RequirePermission('student_note', 'create')
  @Post()
  create(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStudentNoteDto,
  ) {
    return this.studentNoteService.create(enrollmentId, user, dto);
  }

  @RequirePermission('student_note', 'delete')
  @Delete(':id')
  remove(@Param('enrollmentId') enrollmentId: string, @Param('id') id: string) {
    return this.studentNoteService.remove(enrollmentId, id);
  }
}
