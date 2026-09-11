// ============================================================================
// cursos/nuevo/page.tsx — Crear un Curso nuevo.
//
// El periodo académico es OPCIONAL (ver create-course.dto.ts): antes, sin
// ningún periodo creado, esta pantalla mostraba solo un aviso con un enlace
// a /periodos, bloqueando por completo la creación del primer curso de una
// institución nueva. Hoy el formulario siempre se muestra, con "Sin periodo
// (asignar después)" como opción — y quien prefiera crear uno ahí mismo
// puede hacerlo desde el popup, sin perder lo que ya completó acá (código,
// nombre, etc.).
//
// El formulario y el popup viven en CursoForms.tsx (Client Component) A
// PROPOSITO -- ver la nota extensa en actions.ts: esas Server Actions ya NO
// llaman a redirect(), necesitan "useActionState" (solo disponible del lado
// del cliente) para poder mostrar el error, y el periodo recién creado se
// agrega al <select> por estado de React en vez de por query param.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getLocale } from '@/lib/locale';
import { CursoForms } from './CursoForms';

const TEXT = {
  es: {
    back: '← Cursos',
    title: 'Crear un curso nuevo',
    term: 'Periodo académico',
    noTerm: 'Sin periodo (asignar después)',
    createTermToggle: '+ Crear un periodo nuevo',
    termCreated: (name: string) => `Periodo "${name}" creado y seleccionado.`,
    codePlaceholder: 'Código (ej. "CONT-101")',
    titlePlaceholder: 'Nombre del curso',
    gradingScale: 'Escala de notas (opcional, se puede asignar después)',
    template: 'Plantilla de certificado (opcional, se puede asignar después)',
    unassigned: 'Sin asignar todavía',
    submit: 'Crear curso',
    submitting: 'Creando…',
    modalTitle: 'Crear un periodo nuevo',
    modalName: 'Nombre',
    modalNamePlaceholder: 'Ej. "2026 - Semestre I"',
    modalStart: 'Fecha de inicio',
    modalEnd: 'Fecha de fin',
    modalSubmit: 'Crear periodo',
    modalSubmitting: 'Creando…',
    modalCancel: 'Cancelar',
  },
  en: {
    back: '← Courses',
    title: 'Create a new course',
    term: 'Academic term',
    noTerm: 'No term (assign later)',
    createTermToggle: '+ Create a new term',
    termCreated: (name: string) => `Term "${name}" created and selected.`,
    codePlaceholder: 'Code (e.g. "CONT-101")',
    titlePlaceholder: 'Course name',
    gradingScale: 'Grading scale (optional, can be assigned later)',
    template: 'Certificate template (optional, can be assigned later)',
    unassigned: 'Not assigned yet',
    submit: 'Create course',
    submitting: 'Creating…',
    modalTitle: 'Create a new term',
    modalName: 'Name',
    modalNamePlaceholder: 'E.g. "2026 - Term I"',
    modalStart: 'Start date',
    modalEnd: 'End date',
    modalSubmit: 'Create term',
    modalSubmitting: 'Creating…',
    modalCancel: 'Cancel',
  },
};

interface Term {
  id: string;
  name: string;
}

interface GradingScale {
  id: string;
  name: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
}

export default async function NuevoCursoPage() {
  const token = await requireAccessToken();
  const tr = TEXT[await getLocale()];

  let terms: Term[];
  try {
    terms = await apiFetch<Term[]>(token, '/terms');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // Escala de notas y plantilla de certificado son OPCIONALES al crear un
  // curso (se pueden asignar después, ver cursos/[courseId]/page.tsx) — si
  // el rol no tiene permiso para verlas, simplemente no se ofrecen esos dos
  // selects, sin romper el resto del formulario.
  let gradingScales: GradingScale[] | null = null;
  try {
    gradingScales = await apiFetch<GradingScale[]>(token, '/grading-scales');
  } catch {
    gradingScales = null;
  }

  let templates: CertificateTemplate[] | null = null;
  try {
    templates = await apiFetch<CertificateTemplate[]>(token, '/certificate-templates');
  } catch {
    templates = null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/cursos" className="text-sm text-muted hover:underline">
        {tr.back}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{tr.title}</h1>

      <CursoForms initialTerms={terms} gradingScales={gradingScales} templates={templates} tr={tr} />
    </div>
  );
}
