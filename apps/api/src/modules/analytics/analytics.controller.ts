// ============================================================================
// analytics.controller.ts — "POST /analytics/events" NO usa JwtAuthGuard (la
// grabacion sale del PROPIO servidor de Next.js, ver apps/web/lib/analytics.ts,
// antes de que exista cualquier sesion de usuario real — ej. "landing_view").
// Pero SI exige un secreto compartido servidor-a-servidor (ver
// "ANALYTICS_INGEST_SECRET" en configuration.ts) — antes no exigia nada mas
// que estar bien formado, así que cualquiera en internet podia mandar
// eventos falsos directo a la API, sin pasar por el frontend (ver auditoria
// de seguridad, hallazgo F-06). "GET /analytics/funnel" (el resumen) SI esta
// protegida con sesion — PlatformAdminGuard, mismo criterio que
// /tenant-registration-requests.
// ============================================================================

import { timingSafeEqual } from 'node:crypto';
import { Body, Controller, Get, Headers, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { PlatformAdminGuard } from '../../auth/platform-admin.guard';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly service: AnalyticsService,
    private readonly configService: ConfigService,
  ) {}

  // Mas generoso que el limite por defecto del backend (60/min, ver
  // app.module.ts): a diferencia de un formulario que llena una persona,
  // ESTE endpoint lo llama el servidor de Next.js una vez por cada visita
  // real a la landing/entrar/login de CUALQUIER visitante — con trafico
  // moderado, 60/min se quedaria corto de verdad, no solo ante abuso.
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  @Post('events')
  create(@Body() dto: CreateAnalyticsEventDto, @Headers('x-internal-secret') providedSecret?: string) {
    this.assertTrustedCaller(providedSecret);
    return this.service.record(dto);
  }

  // Compara con "timingSafeEqual" (no "==="): un simple "===" corta la
  // comparacion en el primer caracter distinto, así que el TIEMPO de
  // respuesta filtra de a poco cuantos caracteres iniciales acerto un
  // atacante que probara el secreto por fuerza bruta — "timingSafeEqual"
  // siempre tarda lo mismo sin importar en que posicion difieren.
  //
  // Sin "ANALYTICS_INGEST_SECRET" configurado (string vacio): se deja pasar
  // igual, sin romper la grabacion de metricas en un ambiente que todavia
  // no lo configuro — mismo criterio "no romper nada por una config que
  // falta" que MailService/AiService (ver configuration.ts).
  private assertTrustedCaller(providedSecret: string | undefined): void {
    const expected = this.configService.get<string>('analyticsIngestSecret');
    if (!expected) {
      return;
    }
    const provided = providedSecret ?? '';
    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(provided);
    const matches =
      expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);
    if (!matches) {
      throw new UnauthorizedException('Falta o es invalido el header "X-Internal-Secret".');
    }
  }

  @UseGuards(PlatformAdminGuard)
  @Get('funnel')
  getFunnel(@Query('days') days?: string) {
    const parsed = days ? Number.parseInt(days, 10) : undefined;
    return this.service.getFunnel(parsed && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
  }
}
