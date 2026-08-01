// ============================================================================
// tenant-context.service.ts — "Memoria" del tenant activo durante un request.
//
// PROBLEMA que resuelve: cuando llega un request HTTP, necesitamos saber
// "a que tenant pertenece" en MUCHOS lugares distintos del codigo (guards de
// permisos, servicios de negocio, el PrismaService al fijar la variable de
// sesion para Row-Level Security...) sin tener que pasar "tenantId" como
// parametro manualmente a traves de cada funcion intermedia.
//
// SOLUCION: usamos AsyncLocalStorage, una utilidad NATIVA de Node.js (no es
// de NestJS ni de Prisma) que permite guardar un valor "atado" a una cadena
// de operaciones asincronas concreta. Cada request HTTP corre dentro de su
// propio "run()" (ver tenant-context.middleware.ts), asi que dos requests
// simultaneos de DOS tenants distintos nunca se pisan entre si, aunque
// compartan el mismo proceso de Node.
//
// Relacion con el resto del proyecto:
// - tenant-context.middleware.ts llama a "run()" una vez por request, apenas
//   resuelve a que tenant pertenece (por subdominio/dominio).
// - prisma.service.ts llama a "getTenantId()" para saber que valor fijar en
//   la variable de sesion de PostgreSQL que usan las politicas RLS
//   (ver apps/api/prisma/rls-policies.sql).
// ============================================================================

import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

// Forma del "paquete" de datos que viaja junto a cada request.
// Se puede ampliar mas adelante (ej. agregar "userId" o "roles resumidos"
// del JWT) sin tocar el resto del codigo que ya usa este servicio.
interface TenantContextStore {
  tenantId: string | null;
}

@Injectable()
export class TenantContextService {
  // Una unica instancia de AsyncLocalStorage para toda la aplicacion
  // (por eso @Injectable sin scope especial: NestJS crea un solo objeto
  // TenantContextService compartido, pero el ESTADO real vive dentro de
  // AsyncLocalStorage, que si es distinto por cada cadena de ejecucion).
  private readonly storage = new AsyncLocalStorage<TenantContextStore>();

  // Envuelve una funcion (tipicamente "el resto del procesamiento del
  // request") para que, mientras se ejecuta, "getTenantId()" devuelva este
  // tenantId especifico. Lo llama tenant-context.middleware.ts una vez por
  // cada request entrante.
  run<T>(tenantId: string | null, callback: () => T): T {
    return this.storage.run({ tenantId }, callback);
  }

  // Lee el tenantId del request actual. Devuelve null si:
  //   a) el request no pertenece a ningun tenant resuelto (ej. una ruta
  //      publica como /verify/:codigo, ver 04-flujos-criticos.md secc. 4.3), o
  //   b) se llama fuera del ciclo de vida de un request (ej. en un test).
  getTenantId(): string | null {
    return this.storage.getStore()?.tenantId ?? null;
  }

  // Version "estricta": la usan los servicios de negocio que SI requieren
  // obligatoriamente un tenant activo (ej. crear un curso). Si no hay
  // tenant resuelto, preferimos lanzar un error claro ahora mismo en vez de
  // dejar que, mas adelante, una consulta a la base de datos devuelva
  // silenciosamente 0 filas por culpa de la politica RLS (ver
  // app_current_tenant() en rls-policies.sql) y que eso se confunda con un
  // simple "no se encontro nada".
  requireTenantId(): string {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      throw new Error(
        'Se esperaba un tenant activo en el contexto del request, pero no hay ninguno resuelto.',
      );
    }
    return tenantId;
  }
}
