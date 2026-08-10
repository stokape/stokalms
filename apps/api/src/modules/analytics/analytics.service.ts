// ============================================================================
// analytics.service.ts — Grabar eventos del embudo de incorporacion y
// resumirlos para el panel de plataforma (ver analytics.controller.ts).
// ============================================================================

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

export interface FunnelSummary {
  windowDays: number;
  landingViews: number;
  entrarSearches: { total: number; found: number; notFound: number };
  loginsStarted: { total: number; institution: number; platformAdmin: number };
  loginsCompleted: number;
  registrationsSubmitted: number;
  registrationRequests: { pending: number; approved: number; rejected: number };
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(dto: CreateAnalyticsEventDto): Promise<{ ok: true }> {
    await this.prisma.analyticsEvent.create({
      data: {
        event: dto.event,
        host: dto.host,
        // Prisma tipa las columnas "Json" como "Prisma.InputJsonValue", no
        // "Record<string, unknown>" (ver mismo patron en tenant.service.ts,
        // section.service.ts) — "metadata" ya paso por class-validator
        // (@IsObject en el DTO), este cast solo ajusta el tipo para Prisma.
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
    return { ok: true };
  }

  // "windowDays" 30 por defecto: suficiente para ver tendencia reciente sin
  // que un pico viejo (ej. una tanda de pruebas de hace meses) distorsione
  // el numero — quien mire el panel puede pedir una ventana mas larga con
  // "?days=".
  async getFunnel(windowDays = 30): Promise<FunnelSummary> {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const eventWhere = { createdAt: { gte: since } };

    const [
      landingViews,
      entrarSearchesTotal,
      entrarSearchesFound,
      loginsStartedTotal,
      loginsStartedInstitution,
      loginsCompleted,
      registrationsSubmitted,
      pending,
      approved,
      rejected,
    ] = await Promise.all([
      this.prisma.analyticsEvent.count({ where: { ...eventWhere, event: 'landing_view' } }),
      this.prisma.analyticsEvent.count({ where: { ...eventWhere, event: 'entrar_search' } }),
      this.prisma.analyticsEvent.count({
        where: { ...eventWhere, event: 'entrar_search', metadata: { path: ['found'], equals: true } },
      }),
      this.prisma.analyticsEvent.count({ where: { ...eventWhere, event: 'login_started' } }),
      this.prisma.analyticsEvent.count({
        where: {
          ...eventWhere,
          event: 'login_started',
          metadata: { path: ['flow'], equals: 'institution' },
        },
      }),
      this.prisma.analyticsEvent.count({ where: { ...eventWhere, event: 'login_completed' } }),
      this.prisma.analyticsEvent.count({ where: { ...eventWhere, event: 'registration_submitted' } }),
      this.prisma.tenantRegistrationRequest.count({ where: { status: 'pending' } }),
      this.prisma.tenantRegistrationRequest.count({ where: { status: 'approved' } }),
      this.prisma.tenantRegistrationRequest.count({ where: { status: 'rejected' } }),
    ]);

    return {
      windowDays,
      landingViews,
      entrarSearches: {
        total: entrarSearchesTotal,
        found: entrarSearchesFound,
        notFound: entrarSearchesTotal - entrarSearchesFound,
      },
      loginsStarted: {
        total: loginsStartedTotal,
        institution: loginsStartedInstitution,
        platformAdmin: loginsStartedTotal - loginsStartedInstitution,
      },
      loginsCompleted,
      registrationsSubmitted,
      registrationRequests: { pending, approved, rejected },
    };
  }
}
