// ============================================================================
// analytics.controller.ts — "POST /analytics/events" es PUBLICA (sin ningun
// guard) a proposito: la grabacion sale del PROPIO servidor de Next.js (ver
// apps/web/lib/analytics.ts), nunca del navegador de quien visita, y ese
// servidor todavia no tiene ninguna sesion en juego en el momento en que
// pasan varios de estos eventos (ej. "landing_view", antes de cualquier
// login). "GET /analytics/funnel" (el resumen) SI esta protegida —
// PlatformAdminGuard, mismo criterio que /tenant-registration-requests.
// ============================================================================

import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PlatformAdminGuard } from '../../auth/platform-admin.guard';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  // Mas generoso que el limite por defecto del backend (60/min, ver
  // app.module.ts): a diferencia de un formulario que llena una persona,
  // ESTE endpoint lo llama el servidor de Next.js una vez por cada visita
  // real a la landing/entrar/login de CUALQUIER visitante — con trafico
  // moderado, 60/min se quedaria corto de verdad, no solo ante abuso.
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  @Post('events')
  create(@Body() dto: CreateAnalyticsEventDto) {
    return this.service.record(dto);
  }

  @UseGuards(PlatformAdminGuard)
  @Get('funnel')
  getFunnel(@Query('days') days?: string) {
    const parsed = days ? Number.parseInt(days, 10) : undefined;
    return this.service.getFunnel(parsed && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
  }
}
