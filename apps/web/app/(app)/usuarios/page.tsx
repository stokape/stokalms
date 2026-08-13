// ============================================================================
// usuarios/page.tsx — Panel de administracion: quién pertenece a la
// institución y qué rol tiene cada quien. Hasta ahora esto SOLO se podía
// hacer escribiendo filas a mano en la tabla "user_roles" de la base de
// datos — el último paso manual que le faltaba a una institución real para
// operar sin depender de quien administra técnicamente la instalación.
//
// Cada persona es una fila COMPACTA (nombre, roles como pastillas) que se
// expande con <details> — sin ninguna linea de JavaScript — para mostrar
// el formulario de asignar/quitar rol. Antes cada persona era una tarjeta
// grande con ese formulario SIEMPRE visible, lo que con más de un puñado
// de personas se volvía una pared repetitiva de controles (se detectó
// mirando la pantalla real con 8 cuentas de prueba).
//
// Solo lo puede usar quien tiene el permiso "role:view"/"role:assign" —
// según prisma/seed.js, hoy eso es únicamente Administrador de entidad
// (y Super Admin). Un Coordinador/Docente que entre aquí va a ver el
// ErrorBanner de "no tienes permiso", que es la respuesta correcta.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, getPermissions, can, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { UsersIcon } from '@/components/ui/icons';
import { fieldClasses, selectClasses, fileInputClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import { asignarRol, quitarRol, asignarRolesCSV, asignarRolMasivo } from './actions';

const TEXT = {
  es: {
    title: 'Usuarios y roles',
    description: 'Quién pertenece a esta institución y qué puede hacer.',
    noMembers: 'Todavía nadie se unió a esta institución.',
    noMembersDescription: 'Para que alguien aparezca aquí, primero tiene que matricularse en un curso o iniciar sesión al menos una vez.',
    browseCourses: 'Ver cursos',
    person: 'Persona',
    roles: 'Roles',
    noRole: 'Sin rol asignado',
    status: 'Estado',
    onlyIn: 'solo en',
    remove: 'Quitar',
    removeConfirm: (role: string, name: string) => `¿Quitarle el rol "${role}" a ${name}?`,
    scopeTitle: 'Acotar a un curso especifico (opcional)',
    wholeTenant: 'Todo el tenant',
    onlyInOption: 'Solo en',
    assignRole: 'Asignar rol',
    footerPrefix: 'Para que alguien nuevo aparezca aquí, primero tiene que matricularse en un curso (ver',
    courses: 'Cursos',
    footerSuffix: ') o iniciar sesión al menos una vez.',
    bulkTitle: 'Asignar roles a varias personas a la vez (CSV)',
    bulkHelp: 'Un archivo con dos columnas separadas por coma: email, nombre del rol — una fila por persona. Cada nombre de rol debe coincidir exactamente con uno de los roles existentes.',
    bulkUpload: 'Subir CSV',
    bulkOk: (count: number, errorNote: string) => `Se procesaron ${count} filas correctamente${errorNote}.`,
    bulkErrorsNote: (n: number) => `, con ${n} error${n === 1 ? '' : 'es'} (detalle abajo)`,
    bulkErrorRow: (email: string, message: string) => `${email}: ${message}`,
    searchPlaceholder: 'Buscar por nombre o email…',
    searchButton: 'Buscar',
    noSearchResults: (q: string) => `Nadie coincide con "${q}".`,
    clearSearch: 'Ver todas las personas',
    selectPerson: (name: string) => `Seleccionar a ${name}`,
    bulkSelectHint: 'Selecciona personas de la lista y elige un rol para asignárselo a todas de una vez (aplica a todo el tenant, sin acotar a un curso).',
    bulkAssignSelected: 'Asignar a los seleccionados',
  },
  en: {
    title: 'Users and roles',
    description: 'Who belongs to this institution and what they can do.',
    noMembers: "No one has joined this institution yet.",
    noMembersDescription: 'For someone to appear here, they first need to enroll in a course or log in at least once.',
    browseCourses: 'View courses',
    person: 'Person',
    roles: 'Roles',
    noRole: 'No role assigned',
    status: 'Status',
    onlyIn: 'only in',
    remove: 'Remove',
    removeConfirm: (role: string, name: string) => `Remove the "${role}" role from ${name}?`,
    scopeTitle: 'Restrict to a specific course (optional)',
    wholeTenant: 'Entire tenant',
    onlyInOption: 'Only in',
    assignRole: 'Assign role',
    footerPrefix: 'For someone new to appear here, they first need to enroll in a course (see',
    courses: 'Courses',
    footerSuffix: ') or log in at least once.',
    bulkTitle: 'Assign roles to several people at once (CSV)',
    bulkHelp: 'A file with two comma-separated columns: email, role name — one row per person. Each role name must match an existing role exactly.',
    bulkUpload: 'Upload CSV',
    bulkOk: (count: number, errorNote: string) => `${count} rows were processed successfully${errorNote}.`,
    bulkErrorsNote: (n: number) => `, with ${n} error${n === 1 ? '' : 's'} (details below)`,
    bulkErrorRow: (email: string, message: string) => `${email}: ${message}`,
    searchPlaceholder: 'Search by name or email…',
    searchButton: 'Search',
    noSearchResults: (q: string) => `No one matches "${q}".`,
    clearSearch: 'View all people',
    selectPerson: (name: string) => `Select ${name}`,
    bulkSelectHint: 'Select people from the list and pick a role to assign it to all of them at once (applies tenant-wide, not scoped to a course).',
    bulkAssignSelected: 'Assign to selected',
  },
};

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
  searchParams: Promise<{ error?: string; bulkOk?: string; bulkErrors?: string; q?: string }>;
}) {
  const { error, bulkOk, bulkErrors, q } = await searchParams;
  const parsedBulkErrors: Array<{ email: string; message?: string }> = bulkErrors
    ? JSON.parse(bulkErrors)
    : [];
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];
  const permissions = await getPermissions(token);
  const canBulkAssign = can(permissions, 'role', 'assign');

  let members: Member[];
  let roles: Role[];
  try {
    [members, roles] = await Promise.all([
      apiFetch<Member[]>(token, '/users'),
      apiFetch<Role[]>(token, '/roles'),
    ]);
  } catch (err) {
    return (
      <div className="mx-auto max-w-3xl px-6">
        <ErrorBanner message={toErrorMessage(err)} />
      </div>
    );
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

  // Mismo criterio que cursos/page.tsx: filtro server-side sobre la lista
  // ya traída, sin JavaScript (form GET, resultado en la URL).
  const query = (q ?? '').trim().toLowerCase();
  const filteredMembers = query
    ? members.filter((m) => m.fullName.toLowerCase().includes(query) || m.email.toLowerCase().includes(query))
    : members;

  return (
    <div className="mx-auto max-w-3xl px-6">
      <PageHeader title={t.title} description={t.description} />

      {members.length > 8 && (
        <form className="mb-6 flex max-w-sm gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder={t.searchPlaceholder}
            className={fieldClasses}
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-black/[.03] dark:hover:bg-white/[.06]"
          >
            {t.searchButton}
          </button>
        </form>
      )}

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {bulkOk !== undefined && (
        <SuccessBanner>
          <p>
            {t.bulkOk(
              Number(bulkOk),
              parsedBulkErrors.length > 0 ? t.bulkErrorsNote(parsedBulkErrors.length) : '',
            )}
          </p>
          {parsedBulkErrors.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-danger">
              {parsedBulkErrors.map((e, i) => (
                <li key={i}>{t.bulkErrorRow(e.email, e.message ?? '')}</li>
              ))}
            </ul>
          )}
        </SuccessBanner>
      )}

      {canBulkAssign && filteredMembers.length > 0 && (
        // Ver la nota junto a los checkboxes mas abajo: este <form> no
        // envuelve la lista — cada fila le manda sus checkboxes marcados via
        // el atributo "form", asociandolos aunque vivan en otra parte del
        // DOM (necesario porque cada fila ya tiene SU PROPIO <form> para
        // asignar/quitar un rol individual, y HTML no permite anidar
        // formularios).
        <form
          id="bulk-role-form"
          action={asignarRolMasivo}
          className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-surface/50 px-4 py-3"
        >
          <p className="mr-2 flex-1 basis-full text-sm text-muted sm:basis-auto">{t.bulkSelectHint}</p>
          <select name="roleId" required className={`max-w-[200px] ${selectClasses}`}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm">
            {t.bulkAssignSelected}
          </Button>
        </form>
      )}

      {members.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={t.noMembers}
          description={t.noMembersDescription}
          action={<LinkButton href="/cursos" variant="secondary">{t.browseCourses}</LinkButton>}
        />
      ) : filteredMembers.length === 0 ? (
        <p className="text-sm text-muted">
          {t.noSearchResults(q ?? '')}{' '}
          <Link href="/usuarios" className="text-primary hover:underline">
            {t.clearSearch}
          </Link>
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center border-b border-border">
            {canBulkAssign && <span className="w-[2.25rem] shrink-0" aria-hidden />}
            <div className="grid flex-1 grid-cols-[1.4fr_1fr_1.5rem] gap-4 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted">
              <span>{t.person}</span>
              <span>{t.roles}</span>
              <span aria-hidden />
            </div>
          </div>

          {filteredMembers.map((m) => (
            <div key={m.userTenantId} className="flex items-start border-b border-border last:border-b-0">
              {/* El checkbox de seleccion NO puede vivir dentro de <summary>:
                 el navegador tambien interpretaria ese click como "abrir/
                 cerrar" el <details> (el toggle nativo reacciona a CUALQUIER
                 click adentro de summary, marque o no marque un checkbox
                 propio). Por eso es hermano de <details>, no hijo de
                 <summary> — y llega al <form id="bulk-role-form"> de mas
                 abajo via el atributo "form", sin necesitar anidar un
                 <form> dentro de otro (invalido en HTML). */}
              {canBulkAssign && (
                <div className="flex h-[52px] w-[2.25rem] shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    name="emails"
                    value={m.email}
                    form="bulk-role-form"
                    aria-label={t.selectPerson(m.fullName)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </div>
              )}
              <details className="group min-w-0 flex-1">
                {/* "list-none" saca el triangulo nativo del navegador — el
                   chevron de mas abajo lo reemplaza, con su propia rotacion
                   via "group-open" (nada de JS: es el mismo mecanismo que
                   ThemeToggle usa para el icono sol/luna, solo que aquí lo
                   dispara <details> en vez de un data-attribute). */}
                <summary className="grid cursor-pointer grid-cols-[1.4fr_1fr_1.5rem] items-center gap-4 px-4 py-3 text-sm outline-none [list-style:none] hover:bg-black/[.02] focus-visible:bg-black/[.02] dark:hover:bg-white/[.04] dark:focus-visible:bg-white/[.04] [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{m.fullName}</p>
                    <p className="truncate text-xs text-muted">{m.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.roles.length === 0 ? (
                      <span className="text-xs text-muted">{t.noRole}</span>
                    ) : (
                      m.roles.map((r) => (
                        <Badge key={r.userRoleId} tone="neutral">
                          {r.roleName}
                          {r.scopeCourseTitle && ` · ${r.scopeCourseTitle}`}
                        </Badge>
                      ))
                    )}
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>

                <div className="border-t border-border bg-black/[.015] px-4 py-4 dark:bg-white/[.02]">
                <p className="mb-2 text-xs text-muted">{t.status}: {m.status}</p>

                {m.roles.length > 0 && (
                  <ul className="mb-3 flex flex-col gap-1.5">
                    {m.roles.map((r) => (
                      <li key={r.userRoleId} className="flex items-center justify-between gap-2 text-sm">
                        <span>
                          {r.roleName}
                          {r.scopeCourseTitle && (
                            <span className="text-muted"> · {t.onlyIn} {r.scopeCourseTitle}</span>
                          )}
                        </span>
                        <form action={quitarRol.bind(null, m.userTenantId, r.userRoleId)}>
                          <ConfirmSubmitButton
                            className="text-xs font-medium text-danger hover:underline"
                            confirmMessage={t.removeConfirm(r.roleName, m.fullName)}
                          >
                            {t.remove}
                          </ConfirmSubmitButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}

                <form
                  action={asignarRol.bind(null, m.userTenantId)}
                  className="flex flex-wrap items-center gap-2"
                >
                  {/* "max-w-[...]" en vez de "w-auto": "selectClasses" ya trae
                     "w-full" (pensado para un <label> propio en una sola
                     columna) — un ancho fijo simplemente le pone un techo,
                     nunca compite con esa utilidad por especificidad (a
                     diferencia de agregar OTRO "w-*"), asi el <select>
                     no fuerza a los demas campos de esta fila a saltar de
                     linea. Mismo truco que dominios/page.tsx. */}
                  <select name="roleId" required className={`max-w-[220px] ${selectClasses}`}>
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
                      title={t.scopeTitle}
                      className={`max-w-[220px] ${selectClasses}`}
                    >
                      <option value="">{t.wholeTenant}</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {t.onlyInOption}: {c.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button type="submit" size="sm">
                    {t.assignRole}
                  </Button>
                </form>
              </div>
              </details>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-muted">
        {t.footerPrefix}{' '}
        <Link href="/cursos" className="text-primary hover:underline">
          {t.courses}
        </Link>
        {t.footerSuffix}
      </p>

      {canBulkAssign && (
        <Card className="mt-6">
          <h2 className="mb-1 text-base font-medium">{t.bulkTitle}</h2>
          <p className="mb-4 text-sm text-muted">{t.bulkHelp}</p>
          <form action={asignarRolesCSV} className="flex flex-wrap items-center gap-3">
            <input name="file" type="file" accept=".csv,text/csv" required className={fileInputClasses} />
            <Button type="submit" variant="secondary" size="sm">
              {t.bulkUpload}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
