// ============================================================================
// tenant.module.ts — Agrupa todo lo necesario para resolver y usar el
// "tenant activo" dentro de la aplicacion.
//
// Este modulo NO tiene controladores propios (no expone rutas HTTP): solo
// junta el servicio de contexto y el middleware para que AppModule (el
// modulo raiz, ver src/app.module.ts) pueda importarlo y aplicar el
// middleware a todas las rutas con "consumer.apply(...)".
//
// @Global(): CASI todo servicio de negocio (Term, Course, Section,
// Enrollment, Assessment...) necesita TenantContextService para saber en
// que tenant esta operando — es infraestructura transversal, igual que
// PrismaService o CasbinService (ver prisma.module.ts y rbac.module.ts,
// que tambien son @Global() por el mismo motivo). Se marco global despues
// de que AuthModule y AcademicModule fallaran al arrancar por no
// importarlo explicitamente ("Nest can't resolve dependencies..."): en vez
// de acordarse de agregar "imports: [TenantModule]" en cada modulo nuevo
// (un olvido facil y repetitivo), alcanza con que AppModule lo importe UNA
// vez, aqui.
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantContextService } from './tenant-context.service';
import { TenantContextMiddleware } from './tenant-context.middleware';

@Global()
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
