// ============================================================================
// certificate-template.controller.ts — Rutas HTTP de plantillas de
// certificado. Sin ":courseId" en la ruta: son un recurso de TENANT (ver la
// nota en create-certificate-template.dto.ts).
// ============================================================================

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { CertificateTemplateService } from './certificate-template.service';
import { CreateCertificateTemplateDto } from './dto/create-certificate-template.dto';
import { UpdateCertificateTemplateDto } from './dto/update-certificate-template.dto';

@Controller('certificate-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CertificateTemplateController {
  constructor(private readonly templateService: CertificateTemplateService) {}

  @RequirePermission('certificate_template', 'create')
  @Post()
  create(@Body() dto: CreateCertificateTemplateDto) {
    return this.templateService.create(dto);
  }

  @RequirePermission('certificate_template', 'view')
  @Get()
  findAll() {
    return this.templateService.findAll();
  }

  @RequirePermission('certificate_template', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @RequirePermission('certificate_template', 'edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCertificateTemplateDto) {
    return this.templateService.update(id, dto);
  }

  @RequirePermission('certificate_template', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templateService.remove(id);
  }
}
