// ============================================================================
// certificate.controller.ts — Emision, listado y revocacion de certificados
// de UNA matricula concreta. No va nesteado bajo curso/seccion porque
// "enrollmentId" ya identifica de forma unica (y ya esta protegido por RLS
// via tenant) todo lo que hace falta — igual que grading-scales no necesita
// nestearse bajo curso (ver la nota en su propio controller).
// ============================================================================

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { CertificateService } from './certificate.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';

@Controller('enrollments/:enrollmentId/certificates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @RequirePermission('certificate', 'issue')
  @Post()
  issue(@Param('enrollmentId') enrollmentId: string, @Body() dto: IssueCertificateDto) {
    return this.certificateService.issue(enrollmentId, dto);
  }

  // Sin @RequirePermission a proposito: "certificate:view" (staff) y
  // "certificate:view_own" (estudiante, solo su propia matricula) son un
  // "O" logico que CertificateService.assertCanViewCertificatesOf resuelve
  // el mismo — ver el comentario extenso alli.
  @Get()
  findAll(@Param('enrollmentId') enrollmentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.certificateService.findAllByEnrollment(enrollmentId, user);
  }
}

// Rutas de un certificado individual, ya identificado por su propio "id"
// (no necesitan el "enrollmentId" del padre en la URL): se separan en su
// propio controller porque su ruta base es distinta ("/certificates/:id",
// no "/enrollments/:enrollmentId/certificates/:id").
@Controller('certificates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CertificateByIdController {
  constructor(private readonly certificateService: CertificateService) {}

  // Mismo motivo que CertificateController.findAll: sin decorador,
  // resuelto dentro del servicio con el "O" entre "view" y "view_own".
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.certificateService.findOne(id, user);
  }

  @RequirePermission('certificate', 'revoke')
  @Patch(':id/revoke')
  revoke(@Param('id') id: string) {
    return this.certificateService.revoke(id);
  }
}
