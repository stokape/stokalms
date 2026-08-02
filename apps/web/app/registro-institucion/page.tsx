// ============================================================================
// registro-institucion/page.tsx — Formulario PUBLICO de alta de una
// institucion nueva. Crea una SOLICITUD (ver
// apps/api/src/modules/tenant-registration/), no un tenant directo: queda
// pendiente de que un administrador de plataforma la revise (ver
// admin-plataforma/solicitudes/page.tsx) — no es autoservicio instantaneo.
// ============================================================================

import Link from 'next/link';
import { ErrorBanner } from '@/components/ErrorBanner';
import { crearSolicitud } from './actions';

export default async function RegistroInstitucionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; enviado?: string }>;
}) {
  const { error, enviado } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-6 text-sm text-zinc-500 hover:underline">
        &larr; Volver al inicio
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">Inscribí tu institución</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Completá este formulario y un administrador de la plataforma va a revisar tu solicitud.
        Te vamos a contactar al email que dejes acá con la respuesta.
      </p>

      {enviado && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          <p className="font-medium">¡Listo! Recibimos tu solicitud.</p>
          <p className="mt-1">
            Te vamos a escribir al email que dejaste apenas la revisemos. Mientras tanto, no hace
            falta que hagas nada más.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {!enviado && (
        <form action={crearSolicitud} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Nombre de la institución
            <input
              name="institutionName"
              type="text"
              required
              placeholder="Ej. Instituto San Martín"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Subdominio que querés usar
            <div className="flex items-center gap-2">
              <input
                name="desiredSubdomain"
                type="text"
                required
                pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]"
                placeholder="instituto-sanmartin"
                className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <span className="text-zinc-500">.stokalms.com</span>
            </div>
            <span className="text-xs text-zinc-500">
              Solo minúsculas, números y guiones (ej. &quot;instituto-sanmartin&quot;).
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Tu nombre
            <input
              name="contactName"
              type="text"
              required
              placeholder="Quien va a ser el administrador de la institución"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Tu email
            <input
              name="contactEmail"
              type="email"
              required
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Contanos un poco más (opcional)
            <textarea
              name="message"
              rows={3}
              placeholder="Ej. cuántos estudiantes tienen, qué cursos dictan..."
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Enviar solicitud
          </button>
        </form>
      )}
    </div>
  );
}
