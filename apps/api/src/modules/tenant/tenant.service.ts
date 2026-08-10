// ============================================================================
// tenant.service.ts — Ver y editar los datos de marca de un tenant (nombre,
// logo, fondo, favicon, color, mantenimiento).
//
// Casi todos los metodos existen en DOS versiones:
//   - La version "ParaTenant(tenantId, ...)": recibe el tenantId EXPLICITO
//     como parametro. Es la logica real (consulta/actualiza Prisma,
//     resuelve URLs firmadas, sube archivos).
//   - La version SIN "tenantId" (getCurrent, update, updateLogo...): la usa
//     el autoservicio de cada institucion sobre SI MISMA — toma el tenantId
//     de "tenantContext.requireTenantId()" (resuelto por el Host del
//     request, ver tenant-context.middleware.ts) y delega en la version
//     parametrizada de arriba.
//
// POR QUE este split: platform-tenants.service.ts (panel de plataforma,
// ver la nota extensa ahi) necesita las MISMAS operaciones pero sobre
// CUALQUIER institucion, no solo la del request activo — en vez de
// duplicar toda la logica de subida de archivos/resolucion de URLs
// firmadas (like tenant-domain.service.ts SI duplica, por ser mucho mas
// chico), esta clase expone directamente los metodos "ParaTenant" y
// PlatformTenantsService los llama con el tenantId que saca de la URL.
// ============================================================================

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { StorageService } from '../../common/storage/storage.service';
import { AuditService } from '../../common/audit/audit.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

interface StoredBranding {
  logoKey?: string;
  backgroundImageKey?: string;
  backgroundColor?: string;
  // Color de MARCA (botones, links) — a diferencia de "backgroundColor"
  // (que es solo un color de respaldo detras de la tarjeta de login), este
  // SI se aplica en toda la app de esa institucion (ver
  // apps/web/app/layout.tsx, que lo inyecta como variables CSS
  // "--primary"/"--primary-hover"/"--primary-foreground"). Sin valor =
  // esa institucion usa el Azul Stoka por defecto.
  primaryColor?: string;
  // Favicon propio — si falta, el frontend cae al favicon de Stoka (ver
  // apps/web/app/layout.tsx, "generateMetadata").
  faviconKey?: string;
  // Imagen de fondo del landing TEMPORAL de mantenimiento (ver
  // maintenance-mode más abajo) — separada de "backgroundImageKey" (que es
  // el fondo normal, de todos los días) para que activar/desactivar el
  // mantenimiento no pise ni dependa del fondo habitual de la institución.
  maintenanceImageKey?: string;
  // Oculta el sello "Hecho con Stoka LMS" (ver update-tenant.dto.ts) —
  // vive junto al resto de la marca porque, igual que el logo o el color,
  // es una decision de branding de la institucion, no un feature-flag
  // operativo (a diferencia de TenantFeature, que es para cosas como
  // "auto_issue_certificate", ver automations.service.ts).
  hideStokaBranding?: boolean;
}

type BrandingImageField = 'logoKey' | 'backgroundImageKey' | 'faviconKey' | 'maintenanceImageKey';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly storage: StorageService,
    private readonly auditService: AuditService,
  ) {}

  // "tenants" NO tiene Row-Level Security (ver rls-policies.sql) — el
  // aislamiento de la version SIN tenantId lo da, en cambio, que SIEMPRE
  // se busca por el tenantId resuelto por el Host del request, nunca por
  // uno recibido del cliente. La version CON tenantId explicito la usan
  // rutas ya protegidas de otra forma (PlatformAdminGuard, ver
  // platform-tenants.service.ts), asi que buscar por un id "de cualquiera"
  // es intencional ahi.
  private async findTenantOrThrow(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`No existe la institución "${tenantId}".`);
    }
    return tenant;
  }

  // El bucket de archivos NO es publico (ver storage.service.ts): "logoKey"/
  // "backgroundImageKey"/"faviconKey" son keys guardadas en "branding",
  // nunca una URL directa — aca se resuelven a una URL firmada FRESCA en
  // cada respuesta (mismo patron que profile.service.ts con el avatar),
  // para que nunca se guarde una URL que vence a la hora.
  private async withResolvedBranding(name: string, branding: unknown) {
    const stored = (branding as StoredBranding) ?? {};
    const [logoUrl, backgroundImageUrl, faviconUrl, maintenanceImageUrl] = await Promise.all([
      stored.logoKey ? this.storage.getPresignedDownloadUrl(stored.logoKey) : undefined,
      stored.backgroundImageKey
        ? this.storage.getPresignedDownloadUrl(stored.backgroundImageKey)
        : undefined,
      stored.faviconKey ? this.storage.getPresignedDownloadUrl(stored.faviconKey) : undefined,
      stored.maintenanceImageKey
        ? this.storage.getPresignedDownloadUrl(stored.maintenanceImageKey)
        : undefined,
    ]);

    return {
      name,
      branding: {
        ...(logoUrl && { logoUrl }),
        ...(stored.backgroundColor && { backgroundColor: stored.backgroundColor }),
        ...(backgroundImageUrl && { backgroundImageUrl }),
        ...(stored.primaryColor && { primaryColor: stored.primaryColor }),
        ...(faviconUrl && { faviconUrl }),
        // A diferencia de las URLs de arriba, false es un valor tan valido
        // como true (el default es "sello visible") — por eso va siempre,
        // no detras de un "&&" que lo omitiria cuando es false.
        hideStokaBranding: Boolean(stored.hideStokaBranding),
      },
      // Va SUELTO, no dentro de "branding": es la imagen del aviso de
      // mantenimiento, no la marca de todos los dias (ver la nota en
      // StoredBranding) — mezclarla ahi haria que BrandingStudio.tsx la
      // pisara sin querer al guardar un cambio de color/logo normal.
      ...(maintenanceImageUrl && { maintenanceImageUrl }),
    };
  }

  async getBrandingForTenant(tenantId: string) {
    const tenant = await this.findTenantOrThrow(tenantId);
    const resolved = await this.withResolvedBranding(tenant.name, tenant.branding);
    return { ...tenant, ...resolved };
  }

  async getCurrent() {
    return this.getBrandingForTenant(this.tenantContext.requireTenantId());
  }

  async updateForTenant(tenantId: string, dto: UpdateTenantDto) {
    const current = await this.findTenantOrThrow(tenantId);

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        // Se MEZCLA con la marca existente en vez de reemplazarla entera:
        // si alguien solo actualiza el color de fondo, no queremos perder
        // el logo que ya tenia cargado.
        ...(dto.branding !== undefined && {
          branding: {
            ...(current.branding as object),
            ...dto.branding,
          } as Prisma.InputJsonValue,
        }),
        ...(dto.maintenanceMode !== undefined && { maintenanceMode: dto.maintenanceMode }),
        // "" desde el formulario significa "borrar" (ver update-tenant.dto.ts) —
        // por eso el string vacio se guarda como null, no como "".
        ...(dto.maintenanceMessage !== undefined && {
          maintenanceMessage: dto.maintenanceMessage || null,
        }),
        ...(dto.maintenanceEndsAt !== undefined && {
          maintenanceEndsAt: dto.maintenanceEndsAt ? new Date(dto.maintenanceEndsAt) : null,
        }),
      },
    });

    const resolved = await this.withResolvedBranding(tenant.name, tenant.branding);
    return { ...tenant, ...resolved };
  }

  async update(dto: UpdateTenantDto, actorUserId?: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const result = await this.updateForTenant(tenantId, dto);
    await this.auditService.record(tenantId, {
      userId: actorUserId,
      action: 'tenant.updated',
      payload: { fields: Object.keys(dto) },
    });
    return result;
  }

  // Sube una imagen de marca como archivo real (ver profile.service.ts,
  // mismo patron con la foto de perfil) — reemplaza la anterior si ya
  // habia una, sin dejarla huerfana en el bucket (simplificacion de MVP:
  // no se borra el archivo viejo del bucket, solo deja de estar
  // referenciado — mismo criterio que profile.service.ts con avatares).
  async updateBrandingImageForTenant(
    tenantId: string,
    field: BrandingImageField,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen.');
    }

    const current = await this.findTenantOrThrow(tenantId);

    const key = `branding/${tenantId}/${field}/${randomUUID()}-${file.originalname}`;
    await this.storage.upload(key, file.buffer, file.mimetype);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        branding: {
          ...(current.branding as object),
          [field]: key,
        } as Prisma.InputJsonValue,
      },
    });

    return this.getBrandingForTenant(tenantId);
  }

  async updateLogo(file: { originalname: string; mimetype: string; buffer: Buffer }) {
    return this.updateBrandingImageForTenant(this.tenantContext.requireTenantId(), 'logoKey', file);
  }

  async updateBackgroundImage(file: { originalname: string; mimetype: string; buffer: Buffer }) {
    return this.updateBrandingImageForTenant(
      this.tenantContext.requireTenantId(),
      'backgroundImageKey',
      file,
    );
  }

  // Favicon propio de la institucion (ej. el navegador, la pestaña). Se
  // resuelve en apps/web/app/layout.tsx via "generateMetadata" a partir
  // del "faviconUrl" de /tenant/public — cae al favicon de Stoka
  // (app/icon.png) si esta institucion no subio ninguno.
  async updateFavicon(file: { originalname: string; mimetype: string; buffer: Buffer }) {
    return this.updateBrandingImageForTenant(this.tenantContext.requireTenantId(), 'faviconKey', file);
  }

  // Imagen de fondo del landing de mantenimiento (ver /mantenimiento en el
  // frontend) — se sube y se guarda IGUAL que el logo/fondo normales
  // (mismo storage, misma resolucion a URL firmada), pero en su propia key
  // separada (ver la nota en StoredBranding).
  async updateMaintenanceImage(file: { originalname: string; mimetype: string; buffer: Buffer }) {
    return this.updateBrandingImageForTenant(
      this.tenantContext.requireTenantId(),
      'maintenanceImageKey',
      file,
    );
  }

  // No borra el archivo del bucket (misma simplificacion de MVP que el
  // resto de las imagenes de marca) — solo deja de estar referenciado, asi
  // que el landing de mantenimiento vuelve a mostrarse sin imagen de fondo.
  async removeMaintenanceImageForTenant(tenantId: string) {
    const current = await this.findTenantOrThrow(tenantId);
    const branding = { ...(current.branding as StoredBranding) };
    delete branding.maintenanceImageKey;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { branding: branding as Prisma.InputJsonValue },
    });

    return this.getBrandingForTenant(tenantId);
  }

  async removeMaintenanceImage() {
    return this.removeMaintenanceImageForTenant(this.tenantContext.requireTenantId());
  }

  // Version PUBLICA (sin autenticacion) para el home de cada institucion
  // (ver apps/web/app/page.tsx) Y para el layout raiz de TODA la app (ver
  // apps/web/app/layout.tsx: favicon + color de marca dinamicos) — solo
  // expone lo que es seguro mostrarle a cualquiera ANTES de iniciar sesion
  // (nombre y marca, con logo/fondo/favicon ya resueltos a una URL firmada
  // fresca), nunca el resto de las columnas de "tenants" (plan comercial, etc.).
  async getPublicInfo(): Promise<{
    name: string;
    branding: unknown;
    // Institucion desactivada por PLATAFORMA (ver Tenant.active, schema.prisma
    // y tenant-context.middleware.ts) — este endpoint es, a proposito, la
    // UNICA ruta que el middleware deja pasar para un tenant desactivado
    // (cualquier otra corta con 403 antes de llegar aca), justo para que el
    // frontend pueda mostrar esta pantalla en vez de un error generico. Ver
    // apps/web/app/page.tsx e InstitutionHome.tsx.
    active: boolean;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    maintenanceEndsAt?: Date;
    maintenanceImageUrl?: string;
  } | null> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      // Sin tenant resuelto (ej. se entro por el dominio raiz de la
      // plataforma, no por el subdominio de ninguna institucion): el
      // frontend interpreta "null" como "mostrar el home generico de
      // Stoka LMS con el boton de inscribir una institucion nueva" (y,
      // en el layout raiz, el favicon/color por defecto de Stoka).
      return null;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        branding: true,
        active: true,
        maintenanceMode: true,
        maintenanceMessage: true,
        maintenanceEndsAt: true,
      },
    });
    if (!tenant) return null;

    const { maintenanceImageUrl, ...resolved } = await this.withResolvedBranding(
      tenant.name,
      tenant.branding,
    );
    return {
      ...resolved,
      active: tenant.active,
      maintenanceMode: tenant.maintenanceMode,
      // El mensaje/fecha/imagen solo importan (y solo se mandan) mientras
      // el modo esta prendido — no hace falta exponerlos, ni queda
      // "colgado" un mensaje o imagen vieja, cuando esta apagado.
      ...(tenant.maintenanceMode && {
        ...(tenant.maintenanceMessage && { maintenanceMessage: tenant.maintenanceMessage }),
        ...(tenant.maintenanceEndsAt && { maintenanceEndsAt: tenant.maintenanceEndsAt }),
        ...(maintenanceImageUrl && { maintenanceImageUrl }),
      }),
    };
  }
}
