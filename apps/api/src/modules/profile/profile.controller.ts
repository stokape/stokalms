// ============================================================================
// profile.controller.ts — "Mi perfil". Solo JwtAuthGuard (ver la nota
// extensa en profile.service.ts sobre por que no hace falta PermissionsGuard).
// ============================================================================

import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getMine(user);
  }

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      // Una foto de perfil no necesita el mismo techo que un recurso de
      // curso (ver resource.controller.ts) — 5MB alcanza de sobra para
      // cualquier foto real y evita que alguien suba, por error o a
      // proposito, un archivo enorme como "avatar".
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updatePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Falta el archivo de la foto (campo "file").');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('La foto de perfil debe ser una imagen.');
    }
    return this.profileService.updatePhoto(user, file);
  }
}
