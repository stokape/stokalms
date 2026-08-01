// ============================================================================
// tenant.module.ts — Agrupa todo lo necesario para resolver y usar el
// "tenant activo" dentro de la aplicacion.
//
// Este modulo NO tiene controladores propios (no expone rutas HTTP): solo
// junta el servicio de contexto y el middleware para que AppModule (el
// modulo raiz, ver src/app.module.ts) pueda importarlo y aplicar el
// middleware a todas las rutas con "consumer.apply(...)".
// ============================================================================

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantContextService } from './tenant-context.service';
import { TenantContextMiddleware } from './tenant-context.middleware';

@Module({
  // TenantContextMiddleware necesita PrismaService para consultar
  // tenant_domains (ver tenant-context.middleware.ts); por eso este modulo
  // importa PrismaModule.
  imports: [PrismaModule],
  providers: [TenantContextService, TenantContextMiddleware],
  // Se exportan ambos porque AppModule necesita:
  //   - TenantContextMiddleware, para registrarlo en "configure()".
  //   - TenantContextService, para que otros modulos de negocio (Academico,
  //     Matricula, etc.) puedan inyectarlo y leer el tenant activo.
  exports: [TenantContextService, TenantContextMiddleware],
})
export class TenantModule {}
