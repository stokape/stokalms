// ============================================================================
// domain-check.controller.ts — "¿este dominio es de verdad de la
// plataforma?" — SIN autenticacion. Dos llamadores MUY distintos:
//
//   1) Caddy (produccion, ver Caddyfile "on_demand_tls.ask"), antes de
//      emitir un certificado TLS nuevo la PRIMERA vez que alguien visita
//      cualquier subdominio de una institucion (ej. "sanmartin.stokalms.com")
//      o un dominio propio ya verificado — sin esto, Caddy emitiria un
//      certificado para CUALQUIER host que alguien le mandara, gastando de
//      a poco el limite semanal de emisiones de Let's Encrypt. Para Caddy,
//      CUALQUIER subdominio del dominio raiz es valido (?strict SIN pasar,
//      ver mas abajo) — no hace falta que el tenant ya exista, alcanza con
//      que la forma del nombre sea de la plataforma.
//
//   2) app/entrar/page.tsx (frontend): "¿esta institucion EXISTE de
//      verdad?" — una pregunta mas estricta que la de Caddy. Con
//      "?strict=true" se salta el atajo de "cualquier subdominio del
//      dominio raiz" y exige la fila real en tenant_domains, verificada.
//      SIN esto, escribir CUALQUIER cosa en /entrar (incluso un typo)
//      volvia "encontrado" apenas PLATFORM_ROOT_DOMAIN paso a ser
//      "localhost" en desarrollo (un dominio mucho mas generico que
//      "stokalms.com") — se detecto probando el embudo de metricas de
//      punta a punta, no en el enunciado original.
// ============================================================================

import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@SkipThrottle()
@Controller('domain-check')
export class DomainCheckController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // Caddy llama "GET /domain-check?domain=sanmartin.stokalms.com" (ver
  // Caddyfile, "on_demand_tls.ask") e interpreta CUALQUIER respuesta que
  // no sea 2xx como "no, no le emitas certificado a este nombre".
  @Get()
  async check(
    @Query('domain') domain?: string,
    @Query('strict') strict?: string,
  ): Promise<{ ok: true }> {
    const host = (domain ?? '').toLowerCase().trim();
    if (!host) {
      throw new NotFoundException();
    }

    if (strict !== 'true') {
      // El dominio RAIZ de la plataforma (ej. "stokalms.com", sin
      // subdominio) sirve el home generico de Stoka LMS (ver
      // tenant.service.ts, getPublicInfo) — nunca tiene una fila propia en
      // tenant_domains porque no pertenece a ningun tenant. Y CUALQUIER
      // subdominio suyo es valido para Caddy aunque el tenant todavia no
      // exista (ver la nota grande de arriba) — por eso este atajo se
      // salta por completo con "?strict=true".
      const rootDomain = this.config.get<string>('platformRootDomain');
      if (rootDomain && (host === rootDomain || host.endsWith(`.${rootDomain}`))) {
        return { ok: true };
      }
    }

    // Cualquier otro dominio (propio de una institucion, ver
    // tenant-domain.service.ts) solo es legitimo si ya paso la
    // verificacion TXT — mismo criterio que tenant-context.middleware.ts
    // para resolver el tenant, aca para decidir si vale la pena emitirle
    // un certificado (o, en modo estricto, si el tenant existe de verdad).
    const tenantDomain = await this.prisma.tenantDomain.findUnique({
      where: { domain: host },
      select: { verified: true },
    });
    if (tenantDomain?.verified) {
      return { ok: true };
    }

    throw new NotFoundException();
  }
}
