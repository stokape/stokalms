// ============================================================================
// enrollment-attachment.controller.ts — Rutas HTTP del sustento de una
// matrícula, anidadas bajo la matrícula misma (mismo motivo que
// enrollment.controller.ts: PermissionsGuard necesita ":courseId" en la URL).
// ============================================================================

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { ATTACHMENT_MIME_TYPES, mimeAllowlistFilter } from '../../common/storage/file-validation';
import { EnrollmentAttachmentService } from './enrollment-attachment.service';

@Controller('courses/:courseId/sections/:sectionId/enrollments/:enrollmentId/attachments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EnrollmentAttachmentController {
  constructor(private readonly attachmentService: EnrollmentAttachmentService) {}

  @RequirePermission('enrollment_attachment', 'view')
  @Get()
  findAll(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    return this.attachmentService.findAll(courseId, sectionId, enrollmentId);
  }

  @RequirePermission('enrollment_attachment', 'create')
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: mimeAllowlistFilter(ATTACHMENT_MIME_TYPES),
    }),
  )
  async upload(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Falta el archivo de sustento (campo "file").');
    }
    return this.attachmentService.upload(courseId, sectionId, enrollmentId, user, file, description);
  }
}
