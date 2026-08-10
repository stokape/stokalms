// ============================================================================
// prisma.service.ts — Puente entre el backend NestJS y PostgreSQL, usando el
// cliente generado por Prisma a partir de apps/api/prisma/schema.prisma.
//
// Esta clase hace DOS trabajos distintos:
//   1) Ciclo de vida: abre la conexion a la base de datos cuando inicia la
//      aplicacion (onModuleInit) y la cierra ordenadamente al apagarla
//      (onModuleDestroy) — evita conexiones "colgadas".
//   2) Aislamiento multi-tenant: expone "withTenant(...)", el UNICO camino
//      recomendado para ejecutar consultas que deben quedar restringidas al
//      tenant activo, fijando la variable de sesion que las politicas de
//      Row-Level Security leen (ver apps/api/prisma/rls-policies.sql y
//      docs/architecture/adr/ADR-001-multi-tenancy.md).
//
// POR QUE "withTenant" ES EXPLICITO Y NO AUTOMATICO EN TODAS LAS CONSULTAS:
// Se podria "interceptar" automaticamente cada llamada a Prisma para inyectar
// el tenant activo (usando Prisma Client Extensions), pero eso esconde una
// decision de seguridad importante detras de "magia" implicita. Para esta
// base del proyecto se prefiere que cada servicio de negocio declare, a la
// vista, "esta consulta corre en el contexto del tenant X" — mas verboso,
// pero mas facil de auditar en una revision de codigo. Se puede automatizar
// mas adelante si el equipo lo prefiere, una vez que el patron este probado.
// ============================================================================

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

// Tipo del "cliente transaccional" que Prisma pasa dentro de un
// "$transaction(async (tx) => {...})". Tiene los mismos metodos que
// PrismaClient (ej. tx.course.findMany(...)) pero atado a esa transaccion.
// Exportado (no solo local): algun servicio que recibe este "tx" ya
// abierto por OTRO metodo (ver automations.service.ts, "findStaffToNotify")
// necesita poder tipar ese parametro sin repetir esta misma definicion.
export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends' | '$use'
>;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    // "datasourceUrl" sobreescribe, SOLO para esta instancia del cliente, la
    // URL que schema.prisma tomaria por defecto de DATABASE_URL. Aqui la
    // apuntamos deliberadamente a RUNTIME_DATABASE_URL (el rol restringido
    // "stoka_app", sin privilegios de superusuario) para que las politicas
    // de Row-Level Security (ver rls-policies.sql) realmente se apliquen en
    // cada consulta que haga el backend — con el usuario administrador de
    // DATABASE_URL, PostgreSQL las ignora por completo (ver la explicacion
    // detallada al final de apps/api/prisma/rls-policies.sql).
    super({
      datasourceUrl: configService.get<string>('database.runtimeUrl'),
    });
  }

  async onModuleInit() {
    // "$connect" abre el pool de conexiones hacia PostgreSQL usando
    // DATABASE_URL (ver apps/api/prisma/schema.prisma -> datasource db).
    await this.$connect();
    this.logger.log('Conexion a PostgreSQL establecida.');
  }

  async onModuleDestroy() {
    // Se llama automaticamente cuando NestJS apaga la aplicacion
    // (ej. al recibir SIGTERM en produccion), para cerrar las conexiones
    // de forma ordenada en vez de dejarlas abiertas.
    await this.$disconnect();
  }

  // ---------------------------------------------------------------------
  // withTenant: ejecuta "callback" dentro de una transaccion de PostgreSQL
  // en la que YA se fijo el tenant activo para Row-Level Security.
  //
  // Ejemplo de uso tipico dentro de un servicio de negocio:
  //
  //   const cursos = await this.prisma.withTenant(tenantId, (tx) =>
  //     tx.course.findMany({ where: { termId } }),
  //   );
  //
  // Aunque el "where" de arriba NO menciona tenantId, la politica RLS de la
  // tabla "courses" (ver rls-policies.sql) igual filtra por tenant a nivel
  // de base de datos — este metodo es lo que hace posible esa garantia.
  // ---------------------------------------------------------------------
  async withTenant<T>(
    tenantId: string,
    callback: (tx: PrismaTransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // set_config(nombre, valor, is_local) es la forma "parametrizada" de
      // fijar una variable de sesion en PostgreSQL. Usamos esta funcion (en
      // vez de "SET LOCAL app.current_tenant = '...'" armado con texto) para
      // que Prisma pueda enviar tenantId como un PARAMETRO seguro y no como
      // texto concatenado — evita cualquier riesgo de inyeccion SQL aunque
      // tenantId viniera de una fuente menos confiable.
      //
      // El tercer argumento "true" (is_local) significa que el valor SOLO
      // vive dentro de esta transaccion: en cuanto termina, PostgreSQL lo
      // olvida. Asi, cuando esta conexion se reciclé en el pool para
      // atender a OTRO tenant, jamas "arrastra" el tenant anterior.
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;

      return callback(tx);
    });
  }
}
