// ============================================================================
// profile.service.ts — "Mi perfil": autoservicio de CUALQUIER persona sobre
// sus propios datos. A proposito NO pasa por PermissionsGuard/@RequirePermission
// (mismo criterio que "GET /enrollments/mine", ver enrollment.service.ts,
// findMine): ver/editar tu PROPIO perfil no deberia depender de ningun
// permiso administrativo, esta acotado por construccion al usuario del
// token, nunca a otra persona.
//
// SOLO se puede editar la FOTO (ver profile.controller.ts) — el resto de
// los datos (telefono, direccion, departamento/provincia/distrito) hoy son
// de SOLO LECTURA desde esta pantalla: se completan por otra via (a mano en
// la base de datos, o una futura pantalla de administracion) para evitar
// que cualquiera pueda auto-declarar datos de contacto sin ninguna
// verificacion.
// ============================================================================

import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { StorageService } from '../../common/storage/storage.service';
import { AuthenticatedUser } from '../../auth/auth.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly storage: StorageService,
  ) {}

  async getMine(user: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();

    // "enrolledAt" (fecha de inscripcion EN ESTE TENANT) sale de UserTenant,
    // que SI tiene Row-Level Security — el resto de los datos (User) es
    // global y no lo necesita.
    const userTenant = await this.prisma.withTenant(tenantId, (tx) =>
      tx.userTenant.findUniqueOrThrow({ where: { id: user.userTenantId } }),
    );

    const person = await this.prisma.user.findUniqueOrThrow({ where: { id: user.userId } });

    // "image/png" marca "esto es una imagen" para que la URL firmada no
    // fuerce descarga — el endpoint de subida solo acepta imagenes (ver
    // profile.controller.ts), no hace falta el mimetype exacto.
    const avatarUrl = person.avatarKey
      ? await this.storage.getPresignedDownloadUrl(person.avatarKey, 3600, 'image/png')
      : null;

    return {
      // Se expone para que "Mi perfil" (frontend) pueda ofrecerse a si
      // misma como formulario de edicion cuando quien mira tiene
      // "user_profile:edit" (ver user-management/user.service.ts,
      // updateProfile) — reusa EXACTAMENTE el mismo endpoint de staff,
      // apuntado a la propia membresia, en vez de duplicar la logica de
      // edicion aca.
      userTenantId: user.userTenantId,
      email: person.email,
      fullName: person.fullName,
      firstName: person.firstName,
      lastName: person.lastName,
      phone: person.phone,
      address: person.address,
      department: person.department,
      province: person.province,
      district: person.district,
      avatarUrl,
      enrolledAt: userTenant.createdAt,
    };
  }

  async updatePhoto(
    user: AuthenticatedUser,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    const key = `avatars/${user.userId}/${randomUUID()}-${file.originalname}`;
    await this.storage.upload(key, file.buffer, file.mimetype);

    await this.prisma.user.update({ where: { id: user.userId }, data: { avatarKey: key } });

    return { avatarUrl: await this.storage.getPresignedDownloadUrl(key, 3600, 'image/png') };
  }
}
