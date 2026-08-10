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
//   3) Si existe Y esta VERIFICADO (ver tenant-domain.service.ts — los
//      dominios propios que agrega un Administrador de plataforma nacen sin
//      verificar), ya sabemos el tenantId; si no, el request queda "sin
//      tenant" (tenantId = null) — util para rutas que son publicas o de
//      administracion de plataforma, no especificas de un tenant.
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
// - Aca mismo se corta el paso a instituciones DESACTIVADAS por un
//   Administrador de plataforma (ver Tenant.active en schema.prisma y
//   platform-tenants.service.ts) — es el lugar mas temprano posible del
//   ciclo del request, asi que ni un solo controlador de negocio llega a
//   ejecutarse para un tenant desactivado.
// ============================================================================

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from './tenant-context.service';

// Unica ruta que un tenant DESACTIVADO puede seguir llamando: es la que usa
// el home publico (apps/web/app/page.tsx) para saber que mostrar (en este
// caso, una pantalla de "institucion desactivada" en vez de un error
// generico). Se compara contra "req.originalUrl" (con "endsWith", no
// "==="), NUNCA contra "req.path": Nest monta este middleware via
// "forRoutes('*')" por dentro de su propio router, y eso hace que
// "req.path"/"req.url" queden reescritos a "/" para CUALQUIER ruta dentro
// de este middleware (se comprobo en la practica) — "req.originalUrl" es
// el unico que conserva el path real, prefijo "/api/v1" incluido.
const ALLOWED_WHEN_INACTIVE = '/tenant/public';

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
    // CUALQUIER tenant, de eso se trata resolverlo. Se trae "active" en el
    // mismo viaje (via el include de la relacion) para no pagar una
    // segunda consulta aparte.
    const tenantDomain = await this.prisma.tenantDomain.findUnique({
      where: { domain: host },
      select: { tenantId: true, verified: true, tenant: { select: { active: true } } },
    });

    // Un dominio propio recien agregado (ver tenant-domain.service.ts) no
    // resuelve a NINGUN tenant hasta que se verifique la propiedad via TXT
    // — mientras tanto se comporta igual que si el dominio no existiera.
    const tenantId = tenantDomain?.verified ? tenantDomain.tenantId : null;

    const pathOnly = req.originalUrl.split('?')[0];
    if (tenantId && tenantDomain?.tenant.active === false && !pathOnly.endsWith(ALLOWED_WHEN_INACTIVE)) {
      // Se corta ACA, antes de "run()": ningun guard ni controlador llega a
      // ejecutarse, ni siquiera los que no requieren tenant (ej. rutas de
      // administracion de plataforma) — en la practica esto nunca las
      // afecta, porque el panel de plataforma se visita por el dominio raiz
      // de la plataforma, nunca por el dominio de una institucion
      // particular. Mismo formato de error que el resto del backend (ver
      // common/filters/prisma-exception.filter.ts): JSON con "message".
      res.status(403).json({
        statusCode: 403,
        message:
          'Esta institución fue desactivada por el equipo de Stoka LMS. Si crees que es un error, contacta al equipo de plataforma.',
      });
      return;
    }

    // A partir de aqui, CUALQUIER codigo que se ejecute como parte de este
    // request (dentro de la funcion "next()" y todo lo que esta dispare de
    // forma asincrona) puede leer este tenantId llamando a
    // tenantContext.getTenantId(), sin que nosotros tengamos que pasarlo
    // como argumento explicito por cada capa intermedia.
    this.tenantContext.run(tenantId, () => next());
  }
}
