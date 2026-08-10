// ============================================================================
// reportes/export/[type]/route.ts — Descarga de CSV de un reporte (ver
// reports.controller.ts, backend). Route Handler (no Server Action) A
// PROPOSITO, mismo criterio que set-locale/route.ts: una descarga de
// archivo necesita una respuesta HTTP real con sus propios headers
// ("Content-Disposition"), no una transicion de router de Next.js — y el
// backend exige el token de acceso en el header "Authorization", que un
// <a href> comun apuntando directo a la API nunca podria mandar (el
// navegador no tiene el token, solo esta sesion de Next.js lo tiene).
// "[type]" es una key de TYPE_TO_PATH abajo — se valida contra esa misma
// lista para no poder armar una URL hacia un endpoint arbitrario del
// backend. Todos los query params de esta URL se reenvian TAL CUAL (no
// solo "courseId"): "custom" necesita "presetId" ademas, y forzar cada
// caso a mano aca solo duplicaria lo que ValidationPipe ya valida del
// lado del backend (ver reports.controller.ts).
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';

const API_URL = process.env.STOKA_API_URL ?? 'http://localhost:3001/api/v1';

const TYPE_TO_PATH: Record<string, string> = {
  attendance: 'attendance/export',
  grades: 'grades/export',
  'enrollment-progress': 'enrollment-progress/export',
  'raw-enrollments': 'raw-export/enrollments',
  'raw-submissions': 'raw-export/submissions',
  'raw-lesson-views': 'raw-export/lesson-views',
  custom: 'custom/export',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const backendPath = TYPE_TO_PATH[type];
  if (!backendPath) {
    return NextResponse.json({ message: 'Reporte no reconocido.' }, { status: 404 });
  }

  const session = await auth();
  if (!session?.accessToken || session.error) {
    return NextResponse.json({ message: 'Sesión inválida.' }, { status: 401 });
  }

  const qs = request.nextUrl.search;
  // Mismo header "X-Tenant-Host" que apiFetch (ver lib/api.ts) — sin el, el
  // backend no sabria a que institucion pertenece este request (ver la
  // nota extensa en tenant-context.middleware.ts).
  const host = (await headers()).get('host') ?? '';

  const response = await fetch(`${API_URL}/reports/${backendPath}${qs}`, {
    headers: { Authorization: `Bearer ${session.accessToken}`, 'X-Tenant-Host': host },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'No se pudo generar el reporte.' }));
    return NextResponse.json(body, { status: response.status });
  }

  const csv = await response.text();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': response.headers.get('content-disposition') ?? `attachment; filename="reporte.csv"`,
    },
  });
}
