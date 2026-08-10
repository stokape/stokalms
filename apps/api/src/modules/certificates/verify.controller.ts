// ============================================================================
// verify.controller.ts — "GET /api/v1/verify/:codigo": el UNICO endpoint de
// negocio de todo el backend que NO lleva "@UseGuards(JwtAuthGuard, ...)" a
// proposito. Ver docs/architecture/04-flujos-criticos.md, seccion 4.3: quien
// escanea el QR de un certificado impreso no tiene sesion ni token — es el
// publico en general verificando que un documento sea autentico.
//
// Sigue pasando por TenantContextMiddleware (se aplica a "*" en
// app.module.ts), pero eso no importa aqui: certificate.service.ts
// (metodo "verifyPublic") resuelve el tenant a partir del CODIGO, no del
// dominio del request, precisamente porque quien llama puede estar en
// CUALQUIER dominio (ver la nota extensa en rls-policies.sql sobre
// "find_certificate_tenant").
// ============================================================================

import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CertificateService } from './certificate.service';

@Controller('verify')
export class VerifyController {
  constructor(private readonly certificateService: CertificateService) {}

  // Tope mas estricto que el global (10/min en vez de 60/min): sin esto,
  // alguien podria probar codigos de verificacion al azar en rafaga
  // buscando uno valido (enumeracion) — nadie legitimo necesita revisar mas
  // de un puñado de certificados por minuto desde la misma IP.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get(':code')
  verify(@Param('code') code: string) {
    return this.certificateService.verifyPublic(code);
  }
}
