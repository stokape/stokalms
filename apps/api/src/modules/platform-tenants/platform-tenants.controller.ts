// ============================================================================
// platform-tenants.controller.ts — Rutas de "platform/tenants": gestion de
// CUALQUIER institucion desde el panel de plataforma. TODAS protegidas con
// PlatformAdminGuard (mismo criterio que tenant-registration.controller.ts
// y analytics.controller.ts) — no con JwtAuthGuard + PermissionsGuard, que
// exigirian ser miembro de la institucion que se quiere administrar.
// ============================================================================

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PlatformAdminGuard } from '../../auth/platform-admin.guard';
import { UpdateTenantDto } from '../tenant/dto/update-tenant.dto';
import { PlatformTenantsService } from './platform-tenants.service';
import { SetTenantStatusDto } from './dto/set-tenant-status.dto';
import { CreateTenantDomainDto } from '../tenant-domain/dto/create-tenant-domain.dto';
import { AssignRoleDto } from '../user-management/dto/assign-role.dto';

// Mismo limite que tenant.controller.ts (autoservicio) para el mismo tipo
// de archivo — un logo/fondo/favicon institucional no necesita mas que esto.
const IMAGE_UPLOAD_OPTIONS = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
};

@Controller('platform/tenants')
@UseGuards(PlatformAdminGuard)
export class PlatformTenantsController {
  constructor(private readonly service: PlatformTenantsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':tenantId/branding')
  getBranding(@Param('tenantId') tenantId: string) {
    return this.service.getBranding(tenantId);
  }

  @Patch(':tenantId/branding')
  updateBranding(@Param('tenantId') tenantId: string, @Body() dto: UpdateTenantDto) {
    return this.service.updateBranding(tenantId, dto);
  }

  @Post(':tenantId/logo')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  updateLogo(@Param('tenantId') tenantId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta el archivo del logo (campo "file").');
    return this.service.updateLogo(tenantId, file);
  }

  @Post(':tenantId/background-image')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  updateBackgroundImage(@Param('tenantId') tenantId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta el archivo de fondo (campo "file").');
    return this.service.updateBackgroundImage(tenantId, file);
  }

  @Post(':tenantId/favicon')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  updateFavicon(@Param('tenantId') tenantId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta el archivo del favicon (campo "file").');
    return this.service.updateFavicon(tenantId, file);
  }

  @Post(':tenantId/maintenance-image')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  updateMaintenanceImage(@Param('tenantId') tenantId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta el archivo de la imagen (campo "file").');
    return this.service.updateMaintenanceImage(tenantId, file);
  }

  @Delete(':tenantId/maintenance-image')
  removeMaintenanceImage(@Param('tenantId') tenantId: string) {
    return this.service.removeMaintenanceImage(tenantId);
  }

  @Patch(':tenantId/status')
  setStatus(@Param('tenantId') tenantId: string, @Body() dto: SetTenantStatusDto) {
    return this.service.setStatus(tenantId, dto);
  }

  @Get(':tenantId/domains')
  listDomains(@Param('tenantId') tenantId: string) {
    return this.service.listDomains(tenantId);
  }

  @Post(':tenantId/domains')
  addDomain(@Param('tenantId') tenantId: string, @Body() dto: CreateTenantDomainDto) {
    return this.service.addDomain(tenantId, dto);
  }

  @Patch(':tenantId/domains/:domainId/verify')
  verifyDomain(@Param('tenantId') tenantId: string, @Param('domainId') domainId: string) {
    return this.service.verifyDomain(tenantId, domainId);
  }

  @Delete(':tenantId/domains/:domainId')
  removeDomain(@Param('tenantId') tenantId: string, @Param('domainId') domainId: string) {
    return this.service.removeDomain(tenantId, domainId);
  }

  @Get(':tenantId/members')
  listMembers(@Param('tenantId') tenantId: string) {
    return this.service.listMembers(tenantId);
  }

  @Get(':tenantId/roles')
  listAssignableRoles(@Param('tenantId') tenantId: string) {
    return this.service.listAssignableRoles(tenantId);
  }

  @Post(':tenantId/members/:userTenantId/roles')
  assignRole(
    @Param('tenantId') tenantId: string,
    @Param('userTenantId') userTenantId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.service.assignRole(tenantId, userTenantId, dto);
  }

  @Delete(':tenantId/members/:userTenantId/roles/:userRoleId')
  removeRole(
    @Param('tenantId') tenantId: string,
    @Param('userTenantId') userTenantId: string,
    @Param('userRoleId') userRoleId: string,
  ) {
    return this.service.removeRole(tenantId, userTenantId, userRoleId);
  }
}
