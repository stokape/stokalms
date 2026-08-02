// ============================================================================
// tenant-registration.controller.ts — Rutas de alta de instituciones.
//
// "POST /" es PUBLICA a proposito (sin ningun guard): quien la llama
// todavia no tiene cuenta en la plataforma. El resto de las rutas
// (listar/aprobar/rechazar) usan PlatformAdminGuard, NO JwtAuthGuard +
// PermissionsGuard como el resto del backend — ver la nota extensa en
// platform-jwt.strategy.ts sobre por que este caso no encaja en el modelo
// de permisos por tenant.
// ============================================================================

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../../auth/platform-admin.guard';
import { TenantRegistrationService } from './tenant-registration.service';
import { CreateTenantRegistrationDto } from './dto/create-tenant-registration.dto';
import { RejectTenantRegistrationDto } from './dto/reject-tenant-registration.dto';

@Controller('tenant-registration-requests')
export class TenantRegistrationController {
  constructor(private readonly service: TenantRegistrationService) {}

  @Post()
  create(@Body() dto: CreateTenantRegistrationDto) {
    return this.service.create(dto);
  }

  @UseGuards(PlatformAdminGuard)
  @Get()
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @UseGuards(PlatformAdminGuard)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @UseGuards(PlatformAdminGuard)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectTenantRegistrationDto) {
    return this.service.reject(id, dto);
  }
}
