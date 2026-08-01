// ============================================================================
// update-enrollment-status.dto.ts — Body de
// "PATCH .../enrollments/:id". Cambia el ESTADO de una matricula.
//
// Nunca se borra una matricula (ver enrollment.service.ts): "retirar" a un
// estudiante de una seccion cambia su estado a "dropped", preservando el
// registro — igual que un certificado se "revoca" en vez de borrarse (ver
// docs/architecture/04-flujos-criticos.md, seccion 4.3). Esto es lo que
// permite reconstruir despues, por ejemplo, "quienes estuvieron alguna vez
// matriculados en este curso", no solo "quienes estan matriculados hoy".
// ============================================================================

import { IsIn } from 'class-validator';

export class UpdateEnrollmentStatusDto {
  @IsIn(['active', 'dropped', 'completed'])
  status: 'active' | 'dropped' | 'completed';
}
