// ============================================================================
// plantillas-certificado/page.tsx — Catálogo de plantillas de certificado
// (recurso de TENANT, no de curso: se crean una vez y se reutilizan al
// emitir certificados desde cualquier matrícula, ver
// ../matriculas/[enrollmentId]/certificados/page.tsx).
//
// La galería de muestras (SAMPLE_TEMPLATES, ver sample-templates.ts) resuelve
// un problema real: antes solo había un bloque de HTML de ejemplo mínimo
// para copiar a mano — quien no sabe HTML no tenía forma de saber cómo se
// vería el resultado sin publicarlo y emitir un certificado de prueba. Cada
// muestra se ve renderizada de verdad (mismo <iframe sandbox=""> que la
// vista previa del detalle, ver [templateId]/page.tsx) y "Usar esta
// plantilla" precarga el formulario de abajo — todo por navegación de
// servidor (?base=), sin JS de cliente, siguiendo el resto de la app.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { FileIcon } from '@/components/ui/icons';
import { fieldClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import { crearPlantilla } from './actions';
import { SAMPLE_TEMPLATES } from './sample-templates';

const TEXT = {
  es: {
    title: 'Plantillas de certificado',
    description: 'Diseños reutilizables que se asignan a un curso y se usan cada vez que se emite un certificado.',
    existing: 'Plantillas existentes',
    noTemplates: 'Todavía no hay ninguna plantilla creada.',
    startFromSample: 'Empezar desde una muestra',
    sampleHelp: 'Cada muestra es un diseño real y funcional — haz clic en "Usar esta plantilla" para precargarla en el formulario de abajo y después ajústala a gusto.',
    sampleLabel: (label: string) => `Muestra: ${label}`,
    selected: 'Seleccionada',
    useTemplate: 'Usar esta plantilla',
    createTemplate: 'Crear plantilla',
    htmlHelpPrefix: 'El diseño se escribe en HTML. Usa',
    htmlHelpMiddle: 'y',
    htmlHelpSuffix: 'donde quieras que aparezcan esos datos — se reemplazan automáticamente al emitir cada certificado. El logo se toma de',
    brandingSettings: 'Configuración de marca',
    htmlHelpEnd: '; si la institución todavía no cargó ninguno, el placeholder simplemente no muestra nada.',
    namePlaceholder: 'Nombre de la plantilla (ej. Certificado estándar)',
    namePrefix: 'Certificado',
    submit: 'Crear plantilla',
  },
  en: {
    title: 'Certificate templates',
    description: 'Reusable designs that get assigned to a course and used every time a certificate is issued.',
    existing: 'Existing templates',
    noTemplates: 'No templates have been created yet.',
    startFromSample: 'Start from a sample',
    sampleHelp: 'Each sample is a real, working design — click "Use this template" to preload it into the form below and then adjust it to your liking.',
    sampleLabel: (label: string) => `Sample: ${label}`,
    selected: 'Selected',
    useTemplate: 'Use this template',
    createTemplate: 'Create template',
    htmlHelpPrefix: 'The design is written in HTML. Use',
    htmlHelpMiddle: 'and',
    htmlHelpSuffix: 'wherever you want that data to appear — they get replaced automatically when each certificate is issued. The logo is taken from',
    brandingSettings: 'Branding settings',
    htmlHelpEnd: "; if the institution hasn't uploaded one yet, the placeholder simply shows nothing.",
    namePlaceholder: 'Template name (e.g. Standard certificate)',
    namePrefix: 'Certificate',
    submit: 'Create template',
  },
};

interface CertificateTemplate {
  id: string;
  name: string;
}

// Punto de partida "en blanco" para quien prefiere no iniciar de una
// muestra — usa los mismos placeholders que certificate-renderer.service.ts
// reemplaza en el backend (ver el comentario en create-certificate-template.dto.ts).
const PLANTILLA_EN_BLANCO = `<html>
<body style="font-family: sans-serif; text-align: center; padding: 60px;">
  <h1>Certificado de Finalización</h1>
  <p>Se otorga a</p>
  <h2>{{studentName}}</h2>
  <p>por haber completado exitosamente el curso</p>
  <h3>{{courseTitle}}</h3>
  <p>Emitido el {{issueDate}}</p>
  <p>Código de verificación: {{verificationCode}}</p>
  {{qrCode}}
</body>
</html>`;

export default async function PlantillasCertificadoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; base?: string }>;
}) {
  const { error, base } = await searchParams;
  const token = await requireAccessToken();
  const tr = TEXT[await getLocale()];

  let templates: CertificateTemplate[];
  try {
    templates = await apiFetch<CertificateTemplate[]>(token, '/certificate-templates');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  const permissions = await getPermissions(token);
  const canCreate = can(permissions, 'certificate_template', 'create');

  const selectedSample = SAMPLE_TEMPLATES.find((s) => s.key === base);
  const defaultHtml = selectedSample?.html ?? PLANTILLA_EN_BLANCO;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={tr.title} description={tr.description} />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      <Card className="mb-8">
        <h2 className="mb-3 text-base font-medium">{tr.existing}</h2>
        {templates.length === 0 ? (
          <p className="text-sm text-muted">{tr.noTemplates}</p>
        ) : (
          <ul className="divide-y divide-border">
            {templates.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/plantillas-certificado/${t.id}`}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm text-foreground hover:bg-black/[.03] dark:hover:bg-white/[.06]"
                >
                  <span className="flex items-center gap-2 truncate">
                    <FileIcon className="h-4 w-4 shrink-0 text-muted" />
                    {t.name}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4 shrink-0 text-muted"
                  >
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canCreate && (
        <>
          <h2 className="mb-1 text-lg font-medium">{tr.startFromSample}</h2>
          <p className="mb-4 text-sm text-muted">{tr.sampleHelp}</p>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SAMPLE_TEMPLATES.map((sample) => {
              const isSelected = sample.key === base;
              return (
                <Card
                  key={sample.key}
                  className={isSelected ? 'ring-2 ring-primary border-primary' : ''}
                >
                  {/* El iframe se renderiza a su tamaño real (1000x700, como
                      un certificado apaisado) y se reduce con "scale" para
                      que la miniatura muestre el DISEÑO COMPLETO en vez de
                      solo la esquina superior recortada — la alternativa
                      obvia (iframe a 100%/100%) deja el contenido de abajo
                      fuera de la vista, que es justo lo que se queria evitar
                      al pedir una muestra "visual". */}
                  <div className="mx-auto mb-3 h-[189px] w-[270px] overflow-hidden rounded-lg border border-border bg-white">
                    <iframe
                      title={tr.sampleLabel(sample.label)}
                      srcDoc={sample.html}
                      sandbox=""
                      tabIndex={-1}
                      className="pointer-events-none border-0"
                      style={{ width: '1000px', height: '700px', transform: 'scale(0.27)', transformOrigin: 'top left' }}
                    />
                  </div>
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{sample.label}</h3>
                    {isSelected && <Badge tone="info">{tr.selected}</Badge>}
                  </div>
                  <p className="mb-3 text-xs text-muted">{sample.description}</p>
                  <LinkButton
                    href={`/plantillas-certificado?base=${sample.key}#crear-plantilla`}
                    variant={isSelected ? 'secondary' : 'primary'}
                    size="sm"
                  >
                    {tr.useTemplate}
                  </LinkButton>
                </Card>
              );
            })}
          </div>

          <Card id="crear-plantilla">
            <h2 className="mb-3 text-base font-medium">{tr.createTemplate}</h2>
            <p className="mb-3 text-sm text-muted">
              {tr.htmlHelpPrefix} <code>{'{{studentName}}'}</code>,{' '}
              <code>{'{{courseTitle}}'}</code>, <code>{'{{issueDate}}'}</code>,{' '}
              <code>{'{{verificationCode}}'}</code>, <code>{'{{qrCode}}'}</code>,{' '}
              <code>{'{{institutionName}}'}</code> {tr.htmlHelpMiddle} <code>{'{{institutionLogo}}'}</code>{' '}
              {tr.htmlHelpSuffix}{' '}
              <Link href="/configuracion-marca" className="underline">
                {tr.brandingSettings}
              </Link>
              {tr.htmlHelpEnd}
            </p>
            <form action={crearPlantilla} className="flex flex-col gap-3">
              <input
                name="name"
                type="text"
                required
                placeholder={tr.namePlaceholder}
                defaultValue={selectedSample ? `${tr.namePrefix} ${selectedSample.label}` : ''}
                className={fieldClasses}
              />
              <textarea
                key={base ?? 'blank'}
                name="htmlTemplate"
                required
                rows={12}
                defaultValue={defaultHtml}
                className={`${fieldClasses} font-mono text-xs`}
              />
              <Button type="submit" className="self-start">
                {tr.submit}
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
