// ============================================================================
// matriculas/[enrollmentId]/certificados/page.tsx — Certificados de UNA
// matricula: sirve tanto para un Estudiante viendo los SUYOS (permiso
// "certificate:view_own", ver CertificateService.assertCanViewCertificatesOf
// en el backend) como para Coordinador (emite/revoca, "certificate:issue"/
// "revoke") y Docente (solo MIRA, "certificate:view" sin "issue" — un
// Docente no emite certificados, ver prisma/seed.js).
//
// EMITIR ya no pide elegir una plantilla a mano: usa la plantilla FIJA del
// curso de esta matrícula (ver Course.certificateTemplateId, schema.prisma,
// y certificate.service.ts, "issue") — si el curso todavía no tiene una
// asignada, el backend rechaza la emisión con un mensaje claro señalando
// que hay que asignarle una desde el curso (ver cursos/[courseId]/page.tsx).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton';
import { getLocale } from '@/lib/locale';
import { emitirCertificado, revocarCertificado } from './actions';

const TEXT = {
  es: {
    back: '← Mis matrículas',
    title: 'Certificados',
    empty: 'Todavía no se emitió ningún certificado para esta matrícula.',
    issuedOn: 'Emitido el',
    revoked: 'Revocado',
    active: 'Vigente',
    viewVerification: 'Ver página de verificación pública',
    downloadPdf: 'Descargar PDF',
    revoke: 'Revocar',
    revokeConfirm: '¿Revocar este certificado? Queda marcado como inválido en la verificación pública — no se puede deshacer.',
    issueNew: 'Emitir un nuevo certificado',
    issueHelp: 'Se emite con la plantilla ya asignada al curso. Solo se puede emitir si la matrícula ya está en estado "Completado" y el curso tiene una plantilla asignada (esto último se configura desde el detalle del curso).',
    issue: 'Emitir certificado',
  },
  en: {
    back: '← My enrollments',
    title: 'Certificates',
    empty: 'No certificate has been issued for this enrollment yet.',
    issuedOn: 'Issued on',
    revoked: 'Revoked',
    active: 'Active',
    viewVerification: 'View public verification page',
    downloadPdf: 'Download PDF',
    revoke: 'Revoke',
    revokeConfirm: "Revoke this certificate? It's marked invalid on the public verification page — this can't be undone.",
    issueNew: 'Issue a new certificate',
    issueHelp: 'It\'s issued with the template already assigned to the course. It can only be issued if the enrollment is already "Completed" and the course has a template assigned (the latter is configured from the course detail page).',
    issue: 'Issue certificate',
  },
};

interface Certificate {
  id: string;
  verificationCode: string;
  issuedAt: string;
  revoked: boolean;
  downloadUrl: string;
}

export default async function CertificadosDeMatriculaPage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { enrollmentId } = await params;
  const { error } = await searchParams;
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];

  let certificates: Certificate[];
  try {
    certificates = await apiFetch<Certificate[]>(token, `/enrollments/${enrollmentId}/certificates`);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  const permissions = await getPermissions(token);
  const canRevoke = can(permissions, 'certificate', 'revoke');
  const canIssue = can(permissions, 'certificate', 'issue');

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/mis-matriculas" className="text-sm text-zinc-500 hover:underline">
        {t.back}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{t.title}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {certificates.length === 0 ? (
        <p className="mb-8 text-zinc-500">{t.empty}</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {certificates.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-mono text-sm">{c.verificationCode}</p>
                <p className="text-sm text-zinc-500">
                  {t.issuedOn} {new Date(c.issuedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-PE', { dateStyle: 'long' })}
                  {' · '}
                  {c.revoked ? (
                    <span className="text-red-600 dark:text-red-400">{t.revoked}</span>
                  ) : (
                    <span className="text-green-700 dark:text-green-400">{t.active}</span>
                  )}
                </p>
                <Link href={`/verify/${c.verificationCode}`} className="text-sm underline">
                  {t.viewVerification}
                </Link>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <a href={c.downloadUrl} className="text-sm underline" target="_blank" rel="noreferrer">
                  {t.downloadPdf}
                </a>
                {!c.revoked && canRevoke && (
                  <form action={revocarCertificado.bind(null, enrollmentId, c.id)}>
                    <ConfirmSubmitButton
                      className="text-xs text-red-600 underline dark:text-red-400"
                      confirmMessage={t.revokeConfirm}
                    >
                      {t.revoke}
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canIssue && (
        <>
          <h2 className="mb-3 text-lg font-medium">{t.issueNew}</h2>
          <p className="mb-3 text-sm text-zinc-500">{t.issueHelp}</p>
          <form action={emitirCertificado.bind(null, enrollmentId)}>
            <Button type="submit">{t.issue}</Button>
          </form>
        </>
      )}
    </div>
  );
}
