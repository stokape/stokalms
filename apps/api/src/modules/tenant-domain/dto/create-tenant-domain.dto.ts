// ============================================================================
// create-tenant-domain.dto.ts — Body de "POST /tenants/:tenantId/domains".
// Se valida el formato aca (mismo criterio que
// tenant-registration/dto/create-tenant-registration.dto.ts con el
// subdominio) para poder avisar en el momento si el dominio esta mal
// escrito, en vez de que el error aparezca recien al intentar verificarlo.
// ============================================================================

import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

export class CreateTenantDomainDto {
  // Minusculas y sin espacios a los costados: alguien podria pegar el
  // dominio con mayusculas ("Instituto.EDU.PE") o con un espacio de mas sin
  // darse cuenta, y eso rompería la comparacion exacta que hace
  // tenant-context.middleware.ts contra el header "Host" (que el navegador
  // siempre manda en minusculas).
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @Matches(/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/, {
    message:
      'Ingresa un dominio válido (ej. campus.institutosanmartin.edu.pe), sin "http://", sin ":puerto" y sin rutas.',
  })
  domain: string;
}
