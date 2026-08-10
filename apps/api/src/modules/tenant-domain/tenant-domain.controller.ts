// ============================================================================
// tenant-domain.controller.ts — Rutas de administracion de dominios propios
// DE LA institucion activa. "tenant/domains" (dentro de "/tenant", singular
// — ver tenant.controller.ts) a proposito: es "el tenant activo de este
// request", igual que el resto de esas rutas, no administracion de
// plataforma sobre cualquier institucion.
//
// Protegidas con el permiso "tenant:edit" — el mismo que ya exige
// tenant.controller.ts para editar nombre/marca — que hoy SOLO tienen los
// roles "Super Admin" y "Administrador de entidad" (ver prisma/seed.js):
// ningun otro rol (Coordinador, Docente, etc.) puede ver ni tocar esto.
//
// "@UseGuards"/"@RequirePermission" van repetidos en CADA metodo, no una
// sola vez a nivel de clase: PermissionsGuard lee la metadata de
// "@RequirePermission" con "context.getHandler()" (ver permissions.guard.ts),
// que NO mira los decoradores puestos a nivel de clase — ponerlos solo ahi
// dejaria pasar a cualquiera sin chequear nada (se detecto probando con un
// usuario de otro rol, que SI podia entrar). Mismo patron que
// tenant.controller.ts.
// ============================================================================

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { TenantDomainService } from './tenant-domain.service';
import { CreateTenantDomainDto } from './dto/create-tenant-domain.dto';

@Controller('tenant/domains')
export class TenantDomainController {
  constructor(private readonly service: TenantDomainService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'edit')
  @Get()
  list() {
    return this.service.listForCurrentTenant();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'edit')
  @Post()
  addDomain(@Body() dto: CreateTenantDomainDto) {
    return this.service.addDomain(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'edit')
  @Patch(':domainId/verify')
  verifyDomain(@Param('domainId') domainId: string) {
    return this.service.verifyDomain(domainId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'edit')
  @Delete(':domainId')
  removeDomain(@Param('domainId') domainId: string) {
    return this.service.removeDomain(domainId);
  }
}
