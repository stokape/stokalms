// ============================================================================
// tenant-context.middleware.ts — Resuelve "a que tenant pertenece este
// request" ANTES de que llegue a cualquier controlador.
//
// Un "middleware" en NestJS/Express es una funcion que se ejecuta para
// TODO request entrante, antes de que este llegue al controlador que
// finalmente lo atiende. Este es el lugar correcto para resolver el tenant,
// porque asi ningun controlador tiene que acordarse de hacerlo por su cuenta.
//
// COMO SE RESUELVE EL TENANT (ver docs/architecture/01-arquitectura-alto-nivel.md,
// seccion 1.4, "Resolucion del tenant en cada request"):
//   1) Tomamos el header "X-Tenant-Host" si vino, o si no "Host" (ej.
//      "academia.stokalms.com" o "campus.institutosanmartin.edu.pe").
//   2) Buscamos ese dominio EXACTO en la tabla tenant_domains.
//   3) Si existe, ya sabemos el tenantId; si no existe, el request queda
//      "sin tenant" (tenantId = null) — util para rutas que son publicas o
//      de administracion de plataforma, no especificas de un tenant.
//
// POR QUE "X-Tenant-Host" ADEMAS DE "Host": cuando quien llama es un
// NAVEGADOR directo (curl, Postman, un cliente movil), "Host" ya refleja
// el dominio real. Pero el FRONTEND (apps/web) llama a esta API desde el
// SERVIDOR de Next.js hacia una URL fija (STOKA_API_URL, ej.
// "http://localhost:3001") — en ESE caso, "Host" siempre seria
// "localhost:3001" sin importar que subdominio de institucion este
// visitando la persona en su navegador. Por eso el frontend reenvia el
// Host ORIGINAL que si vio (ver apps/web/lib/api.ts) en este header
// aparte, y esta es la unica forma en la que el backend puede resolver el
// tenant correcto cuando frontend y backend son dos servicios separados.
// Se detecto este hueco al construir la personalizacion de marca del home
// de cada institucion (docs/manuales/): sin esto, TODAS las instituciones
// verian siempre la marca del tenant de desarrollo.
//
// Relacion con el resto del proyecto:
// - Usa PrismaService (src/prisma/prisma.service.ts) para la consulta.
// - Guarda el resultado en TenantContextService (./tenant-context.service.ts),
//   que es de donde el resto de la aplicacion (guards, servicios, RLS) lee
//   el tenant activo durante todo el ciclo de vida del request.
// - Se registra en app.module.ts (metodo "configure") para aplicarse a
//   TODAS las rutas.
// ============================================================================

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // "req.headers.host" incluye el puerto si lo hay (ej. "localhost:3001");
    // lo quitamos porque tenant_domains guarda solo el nombre de dominio.
    // "x-tenant-host" tiene prioridad (ver la nota de arriba); si un
    // cliente que no sea nuestro propio frontend lo manda igual, no hay
    // riesgo real: en el peor caso, alguien fuerza CUAL tenant "cree" que
    // esta visitando, pero nunca puede leer datos de otro tenant sin
    // ademas tener un token valido de ESE tenant (ver jwt.strategy.ts +
    // auth.service.ts) — este header solo decide el filtro de Row-Level
    // Security a aplicar, no reemplaza la autenticacion.
    const rawHost = (req.headers['x-tenant-host'] as string | undefined) ?? req.headers.host ?? '';
    const host = rawHost.split(':')[0];

    // tenant_domains NO tiene Row-Level Security (ver la explicacion al
    // inicio de rls-policies.sql): esta consulta debe poder encontrar
    // CUALQUIER tenant, de eso se trata resolverlo.
    const tenantDomain = await this.prisma.tenantDomain.findUnique({
      where: { domain: host },
      select: { tenantId: true },
    });

    const tenantId = tenantDomain?.tenantId ?? null;

    // A partir de aqui, CUALQUIER codigo que se ejecute como parte de este
    // request (dentro de la funcion "next()" y todo lo que esta dispare de
    // forma asincrona) puede leer este tenantId llamando a
    // tenantContext.getTenantId(), sin que nosotros tengamos que pasarlo
    // como argumento explicito por cada capa intermedia.
    this.tenantContext.run(tenantId, () => next());
  }
}
