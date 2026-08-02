// ============================================================================
// resource.controller.ts — Rutas HTTP de los Recursos, anidadas bajo
// "/courses/:courseId/modules/:moduleId/lessons/:lessonId/resources".
//
// SIMPLIFICACIÓN DELIBERADA DEL MVP: el archivo subido se guarda ENTERO en
// memoria (memoryStorage de multer) antes de reenviarlo a MinIO/S3 — igual
// que certificate-renderer.service.ts genera el PDF de forma síncrona
// dentro del request. Para archivos de video largos esto no escala (hay que
// pasar a subida en streaming o URLs firmadas de subida directa desde el
// navegador el día que el volumen lo justifique); por eso existe el límite
// STORAGE_MAX_UPLOAD_MB (ver configuration.ts) que corta antes de agotar
// memoria del proceso.
// ============================================================================

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { AppConfig } from '../../config/configuration';
import { ResourceService } from './resource.service';
import { CreateLinkResourceDto } from './dto/create-link-resource.dto';
import { UploadResourceDto } from './dto/upload-resource.dto';

@Controller('courses/:courseId/modules/:moduleId/lessons/:lessonId/resources')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResourceController {
  constructor(
    private readonly resourceService: ResourceService,
    private readonly configService: ConfigService,
  ) {}

  @RequirePermission('resource', 'create')
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      // El límite real se aplica dinámicamente porque depende de config,
      // pero @UseInterceptors se evalúa en tiempo de arranque (no puede
      // leer ConfigService todavía) — por eso se fija un techo generoso
      // aquí (500MB) y el límite configurable de verdad se revisa a mano
      // dentro del método (ver el chequeo de "file.size" más abajo).
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  async upload(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UploadResourceDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Falta el archivo a subir (campo "file").');
    }
    const maxUploadMb = this.configService.get<AppConfig['storage']>('storage')!.maxUploadMb;
    if (file.size > maxUploadMb * 1024 * 1024) {
      throw new BadRequestException(
        `El archivo pesa más de lo permitido (máximo ${maxUploadMb}MB).`,
      );
    }
    return this.resourceService.uploadFile(courseId, moduleId, lessonId, file, dto.title);
  }

  @RequirePermission('resource', 'create')
  @Post('link')
  createLink(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateLinkResourceDto,
  ) {
    return this.resourceService.createLink(courseId, moduleId, lessonId, dto);
  }

  @RequirePermission('resource', 'view')
  @Get()
  findAll(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.resourceService.findAllByLesson(courseId, moduleId, lessonId);
  }

  @RequirePermission('resource', 'view')
  @Get(':id/download')
  getDownloadUrl(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @Param('id') id: string,
  ) {
    return this.resourceService.getDownloadUrl(courseId, moduleId, lessonId, id);
  }

  @RequirePermission('resource', 'delete')
  @Delete(':id')
  remove(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @Param('id') id: string,
  ) {
    return this.resourceService.remove(courseId, moduleId, lessonId, id);
  }
}
