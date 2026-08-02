// ============================================================================
// mis-certificados/page.tsx — Vista consolidada de TODOS los certificados
// propios, agrupados por curso — antes había que entrar a "Mis matrículas"
// y, matrícula por matrícula, abrir "Certificados" para ver cada uno por
// separado. Usa GET /enrollments/mine (autoservicio, sin permiso
// administrativo, ver enrollment.service.ts) + GET /enrollments/:id/certificates
// por cada matrícula (acotado a "certificate:view_own" — el backend ya
// filtra esto para que solo se puedan ver los certificados PROPIOS).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';

interface EnrollmentMine {
  id: string;
  status: string;
  course: { id: string; code: string; title: string };
  section: { id: string; name: string };
}

interface Certificate {
  id: string;
  verificationCode: string;
  issuedAt: string;
  revoked: boolean;
  downloadUrl: string;
}

export default async function MisCertificadosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const token = await requireAccessToken();

  let enrollments: EnrollmentMine[];
  try {
    enrollments = await apiFetch<EnrollmentMine[]>(token, '/enrollments/mine');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // Se piden los certificados de CADA matrícula en paralelo — un curso sin
  // certificados emitidos simplemente no aparece en la lista final.
  const porCurso = await Promise.all(
    enrollments.map(async (e) => {
      try {
        const certificates = await apiFetch<Certificate[]>(token, `/enrollments/${e.id}/certificates`);
        return { enrollment: e, certificates };
      } catch {
        return { enrollment: e, certificates: [] as Certificate[] };
      }
    }),
  );
  const conCertificados = porCurso.filter((x) => x.certificates.length > 0);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Mis certificados</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {conCertificados.length === 0 ? (
        <p className="text-zinc-500">
          Todavía no tenés ningún certificado emitido. Los certificados se emiten cuando completás un
          curso — mirá tu progreso en{' '}
          <Link href="/mis-matriculas" className="underline">
            Mis matrículas
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-8">
          {conCertificados.map(({ enrollment, certificates }) => (
            <li key={enrollment.id}>
              <h2 className="mb-3 text-lg font-medium">
                {enrollment.course.title}{' '}
                <span className="text-sm font-normal text-zinc-500">
                  ({enrollment.course.code} · {enrollment.section.name})
                </span>
              </h2>
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {certificates.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="font-mono text-sm">{c.verificationCode}</p>
                      <p className="text-sm text-zinc-500">
                        Emitido el{' '}
                        {new Date(c.issuedAt).toLocaleDateString('es-PE', { dateStyle: 'long' })}
                        {' · '}
                        {c.revoked ? (
                          <span className="text-red-600 dark:text-red-400">Revocado</span>
                        ) : (
                          <span className="text-green-700 dark:text-green-400">Vigente</span>
                        )}
                      </p>
                      <Link href={`/verify/${c.verificationCode}`} className="text-sm underline">
                        Ver página de verificación pública
                      </Link>
                    </div>
                    <a href={c.downloadUrl} className="text-sm underline" target="_blank" rel="noreferrer">
                      Descargar PDF
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
