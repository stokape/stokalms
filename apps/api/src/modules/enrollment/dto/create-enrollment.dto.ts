// ============================================================================
// create-enrollment.dto.ts — Body de
// "POST /api/v1/courses/:courseId/sections/:sectionId/enrollments".
//
// Se matricula por EMAIL, no por un "userId" que el cliente ya deberia
// conocer: en la practica (ver docs/architecture/04-flujos-criticos.md,
// seccion 4.1), un coordinador puede estar matriculando a alguien que
// NUNCA inicio sesion en la plataforma todavia. El servicio (ver
// enrollment.service.ts) busca o crea la persona por este email — el mismo
// patron de "aprovisionamiento" que usa el login (ver auth.service.ts),
// solo que disparado por un coordinador en vez de por un login real.
// ============================================================================

import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEnrollmentDto {
  @IsEmail()
  email: string;

  // Solo se usa si la persona TODAVIA no existe en la plataforma (si ya
  // existe, se respeta el nombre que ya tiene registrado — ver
  // enrollment.service.ts).
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;
}
