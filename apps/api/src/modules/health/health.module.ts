// ============================================================================
// health.module.ts — Agrupa todo lo relacionado al endpoint de salud.
//
// En NestJS, un "modulo" (@Module) es una caja que agrupa controladores
// (rutas HTTP) y proveedores (servicios/logica) que pertenecen al mismo tema.
// Este es el modulo mas simple posible: solo tiene un controlador y ningun
// servicio propio, pero sigue la misma forma que tendran los modulos de
// negocio mas complejos (Academico, Matricula, Evaluaciones...) que se
// agregaran en proximos pasos dentro de src/modules/.
// ============================================================================

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
