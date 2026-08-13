// ============================================================================
// request-logging.middleware.ts — Una linea ESTRUCTURADA por request
// terminado (metodo, ruta, status, duracion, tenant, usuario si hay uno) —
// ver auditoria de seguridad, hallazgo "Monitoring" (Fase 18/26): antes,
// los unicos logs eran los "Mapped {...} route" de arranque (una vez) y
// errores sueltos de cada modulo — no habia forma de, por ejemplo, contar
// cuantos 401/403/429 pasaron en los ultimos 5 minutos sin ir a mirar la
// base de datos de auditoria (que ademas solo registra ACCIONES de negocio
// puntuales, ver AuditService, no CADA request).
//
// MIDDLEWARE, no interceptor: un interceptor de NestJS corre DESPUES de los
// guards (JwtAuthGuard, PermissionsGuard, ThrottlerGuard) en el ciclo de
// vida del request — si un guard rechaza el request (401/403/429, que son
// EXACTAMENTE los codigos que mas importa poder contar), un interceptor
// nunca llega a verlo. El middleware, en cambio, corre ANTES que todo eso,
// y "res.on('finish')" se dispara al final SIN IMPORTAR en que capa se
// termino de procesar el request — es el unico punto que ve el resultado
// final de absolutamente todos los requests por igual.
//
// Deliberadamente SIN una libreria nueva (Winston/Pino): loguea con el
// Logger de Nest de siempre, en un formato consistente que cualquier
// recolector de logs (Docker logs -> CloudWatch/Loki/lo que sea) puede
// parsear por regex/JSON sin que este proyecto tenga que integrarse con un
// backend de logging especifico todavia — ese es un paso de infraestructura
// aparte (ver el roadmap de la auditoria, SECURITY-07), esto es la base
// minima de la que ese paso puede partir.
// ============================================================================

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedUser } from '../../auth/auth.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request & { user?: AuthenticatedUser }, response: Response, next: NextFunction): void {
    const start = Date.now();

    response.on('finish', () => {
      const durationMs = Date.now() - start;
      const statusCode = response.statusCode;
      // "userTenantId" identifica a la persona SIN mezclar logs con datos
      // personales (nunca el email/nombre aca) — suficiente para
      // correlacionar "esta cuenta especifica esta generando muchos 403
      // seguidos" sin que este log en si mismo se vuelva un dato sensible
      // mas que proteger. Puede ser "undefined" (nunca se autentico, ej.
      // el propio 401) — se omite del JSON en ese caso via JSON.stringify.
      const line = {
        method: request.method,
        path: request.originalUrl?.split('?')[0],
        statusCode,
        durationMs,
        userTenantId: request.user?.userTenantId,
        tenantId: request.user?.tenantId,
      };

      // WARN para lo que un panel de alertas deberia poder filtrar de un
      // vistazo (401/403/429/5xx); LOG (info) para el resto — mismo
      // criterio de severidad que ya usa el resto del backend (ver
      // PrismaExceptionFilter).
      const isNoteworthy = statusCode === 401 || statusCode === 403 || statusCode === 429 || statusCode >= 500;
      if (isNoteworthy) {
        this.logger.warn(JSON.stringify(line));
      } else {
        this.logger.log(JSON.stringify(line));
      }
    });

    next();
  }
}
