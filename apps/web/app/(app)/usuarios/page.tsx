// ============================================================================
// usuarios/page.tsx — Panel de administracion: quién pertenece a la
// institución y qué rol tiene cada quien. Hasta ahora esto SOLO se podía
// hacer escribiendo filas a mano en la tabla "user_roles" de la base de
// datos — el último paso manual que le faltaba a una institución real para
// operar sin depender de quien administra técnicamente la instalación.
//
// Solo lo puede usar quien tiene el permiso "role:view"/"role:assign" —
// según prisma/seed.js, hoy eso es únicamente Administrador de entidad
// (y Super Admin). Un Coordinador/Docente que entre acá va a ver el
// ErrorBanner de "no tienes permiso", que es la respuesta correcta.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { asignarRol, quitarRol } from './actions';

interface RoleAssignment {
  userRoleId: string;
  roleId: string;
  roleName: string;
  scopeCourseId: string | null;
  scopeCourseTitle: string | null;
}

interface Member {
  userTenantId: string;
  email: string;
  fullName: string;
  status: string;
  roles: RoleAssignment[];
}

interface Role {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const token = await requireAccessToken();

  let members: Member[];
  let roles: Role[];
  try {
    [members, roles] = await Promise.all([
      apiFetch<Member[]>(token, '/users'),
      apiFetch<Role[]>(token, '/roles'),
    ]);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // Los cursos son solo para poder ACOTAR un rol a uno especifico (ej. un
  // Docente asignado a un curso puntual) — si esto falla, el formulario de
  // asignar rol simplemente no ofrece esa opcion (queda "todo el tenant").
  let courses: Course[] | null = null;
  try {
    courses = await apiFetch<Course[]>(token, '/courses');
  } catch {
    courses = null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Usuarios y roles</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {members.length === 0 ? (
        <p className="text-zinc-500">Todavía nadie se unió a esta institución.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {members.map((m) => (
            <li key={m.userTenantId} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="font-medium">
                {m.fullName} <span className="text-sm font-normal text-zinc-500">({m.email})</span>
              </p>
              <p className="mb-3 text-xs text-zinc-500">Estado: {m.status}</p>

              {m.roles.length === 0 ? (
                <p className="mb-3 text-sm text-zinc-500">Sin ningún rol asignado todavía.</p>
              ) : (
                <ul className="mb-3 flex flex-wrap gap-2">
                  {m.roles.map((r) => (
                    <li
                      key={r.userRoleId}
                      className="flex items-center gap-2 rounded-full border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
                    >
                      {r.roleName}
                      {r.scopeCourseTitle && ` (solo en ${r.scopeCourseTitle})`}
                      <form action={quitarRol.bind(null, m.userTenantId, r.userRoleId)}>
                        <button type="submit" className="text-red-600 underline dark:text-red-400">
                          Quitar
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              <form
                action={asignarRol.bind(null, m.userTenantId)}
                className="flex flex-wrap items-center gap-2"
              >
                <select
                  name="roleId"
                  required
                  className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {courses && courses.length > 0 && (
                  <select
                    name="scopeCourseId"
                    defaultValue=""
                    title="Acotar a un curso especifico (opcional)"
                    className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="">Todo el tenant</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        Solo en: {c.title}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="submit"
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Asignar rol
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm text-zinc-500">
        Para que alguien nuevo aparezca acá, primero tiene que matricularse en un curso (ver{' '}
        <Link href="/cursos" className="underline">
          Cursos
        </Link>
        ) o iniciar sesión al menos una vez.
      </p>
    </div>
  );
}
