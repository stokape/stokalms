// ============================================================================
// seguridad/auditoria/export/route.ts — Descarga de CSV del registro de
// auditoría (ver security.controller.ts, backend). Mismo patrón que
// reportes/export/[type]/route.ts: Route Handler, no Server Action, porque
// necesita mandar el Bearer token que el navegador no tiene y setear
// "Content-Disposition" a mano.
// ============================================================================

import { NextResponse } from 'next/server';
import { headers, cookies } from 'next/headers';
import { auth } from '@/auth';

const API_URL = process.env.STOKA_API_URL ?? 'http://localhost:3001/api/v1';

export async function GET() {
  const session = await auth();
  if (!session?.accessToken || session.error) {
    return NextResponse.json({ message: 'Sesión inválida.' }, { status: 401 });
  }

  // Cookie primero, "headers()" de respaldo -- ver la nota extensa en
  // lib/api.ts sobre por que "headers().get('host')" no es confiable en
  // TODOS los casos.
  const host = (await cookies()).get('stoka-tenant-host')?.value || (await headers()).get('host') || '';
  const response = await fetch(`${API_URL}/security/audit-logs/export`, {
    headers: { Authorization: `Bearer ${session.accessToken}`, 'X-Tenant-Host': host },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'No se pudo generar la auditoría.' }));
    return NextResponse.json(body, { status: response.status });
  }

  const csv = await response.text();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': response.headers.get('content-disposition') ?? `attachment; filename="auditoria.csv"`,
    },
  });
}
