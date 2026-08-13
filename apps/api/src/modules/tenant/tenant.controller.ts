// ============================================================================
// tenant.controller.ts — Datos del tenant activo (nombre, marca).
//
// "GET public" va ANTES de las rutas protegidas y sin ningun guard a
// proposito: es lo que llama el home de cada institucion (ver
// apps/web/app/page.tsx) ANTES de que la persona haya iniciado sesion.
// ============================================================================

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
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
import { IMAGE_MIME_TYPES, mimeAllowlistFilter } from '../../common/storage/file-validation';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

// Mismo limite que profile.controller.ts (foto de perfil): un logo/fondo
// institucional no necesita mas que esto. "fileFilter" es la primera capa
// (barata) de la mitigacion de la auditoria de seguridad F-03/SECURITY-03 —
// rechaza tipos no-imagen segun el Content-Type declarado; storage.service.ts
// ("upload") aplica la segunda capa, verificando el CONTENIDO real.
const IMAGE_UPLOAD_OPTIONS = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: mimeAllowlistFilter(IMAGE_MIME_TYPES),
};

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('public')
  getPublicInfo() {
    return this.tenantService.getPublicInfo();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'view')
  @Get()
  getCurrent() {
    return this.tenantService.getCurrent();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'edit')
  @Patch()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'edit')
  @Post('logo')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  async updateLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Falta el archivo del logo (campo "file").');
    }
    return this.tenantService.updateLogo(file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'edit')
  @Post('background-image')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  async updateBackgroundImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Falta el archivo de fondo (campo "file").');
    }
    return this.tenantService.updateBackgroundImage(file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'edit')
  @Post('favicon')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  async updateFavicon(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Falta el archivo del favicon (campo "file").');
    }
    return this.tenantService.updateFavicon(file);
  }

  // Imagen de fondo del landing TEMPORAL de mantenimiento (ver
  // /mantenimiento en el frontend) — separada del logo/fondo de todos los
  // dias, ver la nota en tenant.service.ts (StoredBranding).
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'edit')
  @Post('maintenance-image')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  async updateMaintenanceImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Falta el archivo de la imagen (campo "file").');
    }
    return this.tenantService.updateMaintenanceImage(file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'edit')
  @Delete('maintenance-image')
  removeMaintenanceImage() {
    return this.tenantService.removeMaintenanceImage();
  }
}
