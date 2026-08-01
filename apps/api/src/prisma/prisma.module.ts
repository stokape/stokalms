// ============================================================================
// prisma.module.ts — Hace disponible PrismaService en toda la aplicacion.
//
// @Global() significa que, una vez que AppModule importa este modulo UNA
// sola vez, cualquier otro modulo (Academico, Matricula, Certificados...)
// puede inyectar PrismaService en su constructor SIN tener que volver a
// importar PrismaModule cada vez. Se usa @Global() aqui porque practicamente
// todo modulo de negocio va a necesitar acceso a la base de datos — repetir
// el import en cada uno seria ruido sin beneficio real.
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
